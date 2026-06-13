import { randomUUID } from "node:crypto";
import { S3Client, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { SaveObjectInput, SavedObject, StorageDriver } from "./storage.types.js";

export interface S3StorageConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** If set, objects are served directly from this public CDN/base (no presigning). */
  publicUrl?: string;
}

/** How long a presigned GET URL stays valid (seconds). */
const PRESIGN_TTL = 3600;
/** Stored URL prefix for the presigned-proxy route (private buckets). */
const PROXY_PREFIX = "/api/files";

/**
 * Streams uploads to S3 via `@aws-sdk/lib-storage` (multipart, no full
 * buffering). Private buckets are the default: `save()` returns a stable proxy
 * URL (`/api/files/<key>`) that the files route turns into a short-lived
 * presigned GET. When `publicUrl` is configured (a public bucket/CDN), the
 * direct URL is returned instead.
 */
export class S3StorageDriver implements StorageDriver {
  readonly kind = "s3";
  private readonly client: S3Client;
  private readonly publicBase?: string;

  constructor(private readonly config: S3StorageConfig) {
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.publicBase = config.publicUrl?.replace(/\/+$/, "");
  }

  async save({ body, contentType, prefix, ext }: SaveObjectInput): Promise<SavedObject> {
    const key = `${prefix}/${randomUUID()}${ext}`;
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      },
    });
    await upload.done();
    const url = this.publicBase ? `${this.publicBase}/${key}` : `${PROXY_PREFIX}/${key}`;
    return { key, url };
  }

  /** Presigned GET URL for direct, time-limited browser access to a private object. */
  presignGet(key: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
      { expiresIn: PRESIGN_TTL },
    );
  }

  async deleteByUrl(url: string): Promise<void> {
    const key = this.keyFromUrl(url);
    if (!key) return;
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
    );
  }

  /** Extracts the object key from either a proxy URL or a public/CDN URL. */
  private keyFromUrl(url: string): string | null {
    if (url.startsWith(`${PROXY_PREFIX}/`)) return url.slice(PROXY_PREFIX.length + 1);
    if (this.publicBase && url.startsWith(`${this.publicBase}/`)) {
      return url.slice(this.publicBase.length + 1);
    }
    return null;
  }
}
