import { mkdir } from "node:fs/promises";
import path from "node:path";
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
      const ext = EXT_BY_MIME[file.mimetype];
      if (!ext) throw BadRequest("Only JPEG, PNG, WebP or GIF images are allowed");

      const { url } = await storage.save({
        body: file.file,
        contentType: file.mimetype,
        prefix,
        ext,
      });

      // `truncated` is set when the stream exceeded the size limit; clean up.
      if (file.file.truncated) {
        await storage.deleteByUrl(url).catch(() => {});
        throw BadRequest("Image exceeds the 5 MB size limit");
      }

      app.log.info({ storage: storage.kind, url }, "image uploaded");
      return url;
    });
  },
  { name: "uploads" },
);
