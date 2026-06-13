import path from "node:path";
import { env } from "../../config/env.js";
import { LocalStorageDriver } from "./local-storage.js";
import { S3StorageDriver } from "./s3-storage.js";
import type { StorageDriver } from "./storage.types.js";

export type { StorageDriver, SaveObjectInput, SavedObject } from "./storage.types.js";

/** Builds the storage driver selected by the environment (S3 if configured). */
export function createStorageDriver(): StorageDriver {
  if (env.storageDriver === "s3") {
    return new S3StorageDriver({
      bucket: env.AWS_S3_BUCKET_NAME!,
      region: env.AWS_S3_BUCKET_REGION!,
      accessKeyId: env.AWS_S3_ACCESS_KEY_ID!,
      secretAccessKey: env.AWS_S3_SECRET_ACCESS_KEY!,
      publicUrl: env.AWS_S3_PUBLIC_URL,
    });
  }
  return new LocalStorageDriver(
    path.resolve(process.cwd(), env.UPLOAD_DIR),
    env.UPLOAD_URL_PREFIX,
  );
}
