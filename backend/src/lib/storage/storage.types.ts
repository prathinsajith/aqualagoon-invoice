import type { Readable } from "node:stream";

export interface SaveObjectInput {
  /** The file contents as a stream (never buffered fully in memory). */
  body: Readable;
  contentType: string;
  /** Logical folder/prefix, e.g. "avatars". */
  prefix: string;
  /** File extension including the dot, e.g. ".png". */
  ext: string;
}

export interface SavedObject {
  /** Storage key, e.g. "avatars/<uuid>.png". */
  key: string;
  /** Publicly resolvable URL (relative to the API origin for local storage). */
  url: string;
}

/**
 * Pluggable object storage. The local driver writes to disk (served by
 * @fastify/static); the S3 driver streams to a bucket. Swapping drivers is an
 * env change — nothing in the modules needs to know which is active.
 */
export interface StorageDriver {
  readonly kind: "local" | "s3";
  save(input: SaveObjectInput): Promise<SavedObject>;
  /** Best-effort delete of an object by the URL previously returned by save(). */
  deleteByUrl(url: string): Promise<void>;
  /**
   * Returns a short-lived, directly-fetchable URL for a storage key.
   * Implemented by the S3 driver (presigned GET); absent for local storage,
   * whose objects are already served publicly by @fastify/static.
   */
  presignGet?(key: string): Promise<string>;
}
