import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import fp from "fastify-plugin";
import multipart, { type MultipartFile } from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { env } from "../config/env.js";
import { BadRequest } from "../lib/errors.js";
import { createStorageDriver } from "../lib/storage/index.js";
import type { StorageDriver } from "../lib/storage/index.js";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * Identifies an image by its magic bytes — the authoritative content type, since
 * the client-declared MIME/extension can lie. Returns the canonical MIME or null.
 */
function sniffImageMime(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buf.length >= 6 && buf.toString("ascii", 0, 3) === "GIF") {
    return "image/gif";
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

declare module "fastify" {
  interface FastifyInstance {
    /** The active object-storage driver (local disk or S3). */
    storage: StorageDriver;
    /**
     * Validates and persists an uploaded image via the active storage driver,
     * returning its public URL. Streams the file (no full buffering / temp copy).
     * `prefix` is the logical folder to store under (default "avatars").
     */
    saveImage: (file: MultipartFile, prefix?: string) => Promise<string>;
  }
}

/**
 * Wires multipart parsing and the storage driver (S3 when configured, else
 * local disk served via @fastify/static).
 */
export default fp(
  async (app) => {
    const storage = createStorageDriver();

    await app.register(multipart, {
      limits: { fileSize: MAX_FILE_BYTES, files: 1 },
    });

    // Only the local driver needs a static route to serve the files it writes.
    if (storage.kind === "local") {
      const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
      await mkdir(uploadDir, { recursive: true });
      await app.register(fastifyStatic, {
        root: uploadDir,
        prefix: `${env.UPLOAD_URL_PREFIX}/`,
        decorateReply: false,
      });
    }

    app.decorate("storage", storage);

    app.decorate("saveImage", async (file: MultipartFile, prefix = "avatars"): Promise<string> => {
      // Reject obviously-wrong types early (friendly error) before buffering.
      if (!EXT_BY_MIME[file.mimetype]) {
        throw BadRequest("Only JPEG, PNG, WebP or GIF images are allowed");
      }

      // Buffer the file (capped at MAX_FILE_BYTES) so its real content can be
      // verified before anything is written to storage.
      const buffer = await file.toBuffer();
      if (file.file.truncated) {
        throw BadRequest("Image exceeds the 5 MB size limit");
      }

      // Trust the bytes, not the declared MIME/extension: derive both from the
      // sniffed signature so a mislabeled or polyglot file can't be stored.
      const mime = sniffImageMime(buffer);
      const ext = mime ? EXT_BY_MIME[mime] : undefined;
      if (!mime || !ext) {
        throw BadRequest("File is not a valid JPEG, PNG, WebP or GIF image");
      }

      const { url } = await storage.save({
        body: Readable.from(buffer),
        contentType: mime,
        prefix,
        ext,
      });

      app.log.info({ storage: storage.kind, url }, "image uploaded");
      return url;
    });
  },
  { name: "uploads" },
);
