import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { SaveObjectInput, SavedObject, StorageDriver } from "./storage.types.js";

/** Stores objects on local disk; they are served statically at `urlPrefix`. */
export class LocalStorageDriver implements StorageDriver {
  readonly kind = "local";

  constructor(
    private readonly uploadDir: string,
    private readonly urlPrefix: string,
  ) {}

  async save({ body, prefix, ext }: SaveObjectInput): Promise<SavedObject> {
    const key = `${prefix}/${randomUUID()}${ext}`;
    const dest = path.join(this.uploadDir, key);
    await mkdir(path.dirname(dest), { recursive: true });
    await pipeline(body, createWriteStream(dest));
    return { key, url: `${this.urlPrefix}/${key}` };
  }

  async deleteByUrl(url: string): Promise<void> {
    const base = `${this.urlPrefix}/`;
    if (!url.startsWith(base)) return;
    const key = url.slice(base.length);
    await rm(path.join(this.uploadDir, key), { force: true });
  }
}
