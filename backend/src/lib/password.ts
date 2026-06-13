import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type BinaryLike,
  type ScryptOptions,
} from "node:crypto";

// scrypt cost parameters. N=2^15 is a sensible interactive default; key length
// 64 bytes. Stored format: `scrypt$<saltHex>$<hashHex>`.
const KEYLEN = 64;
const SALT_BYTES = 16;
// N=2^15, r=8 needs ~34 MB, so raise maxmem above the 32 MB default.
const SCRYPT_PARAMS: ScryptOptions = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** Promise wrapper around `crypto.scrypt` that accepts the cost options. */
function scrypt(
  password: BinaryLike,
  salt: BinaryLike,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/**
 * Hashes a plaintext password with scrypt (built into Node — no native build
 * step). A per-password random salt is embedded in the returned string.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = (await scrypt(plain, salt, KEYLEN, SCRYPT_PARAMS)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a stored hash in constant time.
 * Returns false for malformed/unknown hash formats rather than throwing.
 */
export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const salt = Buffer.from(parts[1]!, "hex");
  const expected = Buffer.from(parts[2]!, "hex");
  const derived = (await scrypt(plain, salt, expected.length, SCRYPT_PARAMS)) as Buffer;

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
