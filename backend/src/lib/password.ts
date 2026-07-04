import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type BinaryLike,
  type ScryptOptions,
} from "node:crypto";

/**
 * Password hashing with scrypt (built into Node — no native build step).
 *
 * Stored format is self-describing so the cost can be tuned without locking
 * anyone out:  `scrypt$<N>$<r>$<p>$<saltHex>$<hashHex>`  (6 parts).
 *
 * Legacy hashes written before the params were embedded use the 3-part form
 * `scrypt$<saltHex>$<hashHex>` and are verified with the original cost
 * (N=2^15). On the next successful login `needsRehash()` flags them so the
 * caller can transparently re-hash with the current (cheaper, still-safe)
 * params — so existing users speed up after one sign-in, no migration needed.
 */
const KEYLEN = 64;
const SALT_BYTES = 16;

// Current cost for NEW hashes. N=2^14, r=8, p=1 (~16 MB) — OWASP's minimum
// scrypt work factor; a good balance of security and latency for an internal
// admin app, and roughly half the CPU of the previous N=2^15.
const CURRENT_PARAMS = { N: 16384, r: 8, p: 1 } as const;
// Cost assumed for legacy 3-part hashes (what hashPassword used to emit).
const LEGACY_PARAMS = { N: 32768, r: 8, p: 1 } as const;

// scrypt needs maxmem >= ~128 * N * r bytes; size it for the largest N we use.
const MAXMEM = 64 * 1024 * 1024;

interface CostParams {
  N: number;
  r: number;
  p: number;
}

function scrypt(
  password: BinaryLike,
  salt: BinaryLike,
  keylen: number,
  params: CostParams,
): Promise<Buffer> {
  const options: ScryptOptions = { ...params, maxmem: MAXMEM };
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/** Hashes a plaintext password with the current cost params. */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scrypt(plain, salt, KEYLEN, CURRENT_PARAMS);
  const { N, r, p } = CURRENT_PARAMS;
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/** Parses a stored hash into its params + salt + expected digest, or null. */
function parseStored(
  stored: string,
): { params: CostParams; salt: Buffer; expected: Buffer } | null {
  const parts = stored.split("$");
  if (parts[0] !== "scrypt") return null;

  if (parts.length === 6) {
    const [, n, r, p, saltHex, hashHex] = parts;
    const N = Number(n);
    const rNum = Number(r);
    const pNum = Number(p);
    if (!N || !rNum || !pNum) return null;
    return {
      params: { N, r: rNum, p: pNum },
      salt: Buffer.from(saltHex!, "hex"),
      expected: Buffer.from(hashHex!, "hex"),
    };
  }
  if (parts.length === 3) {
    const [, saltHex, hashHex] = parts;
    return {
      params: LEGACY_PARAMS,
      salt: Buffer.from(saltHex!, "hex"),
      expected: Buffer.from(hashHex!, "hex"),
    };
  }
  return null;
}

/**
 * Verifies a plaintext password against a stored hash in constant time, using
 * whatever cost params the hash was created with. Returns false for malformed
 * or unknown formats rather than throwing.
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parsed = parseStored(stored);
  if (!parsed) return false;
  // Reject truncated/empty hashes: a 0-length salt or digest would otherwise
  // make scrypt derive a 0-length key that trivially matches any password.
  if (parsed.salt.length === 0 || parsed.expected.length === 0) return false;

  const derived = await scrypt(plain, parsed.salt, parsed.expected.length, parsed.params);
  return derived.length === parsed.expected.length && timingSafeEqual(derived, parsed.expected);
}

/**
 * True when a stored hash should be upgraded to the current params (legacy
 * format, or a higher work factor than we now use). Call after a successful
 * verify to transparently re-hash on login.
 */
export function needsRehash(stored: string): boolean {
  const parsed = parseStored(stored);
  if (!parsed) return true;
  return (
    parsed.params.N !== CURRENT_PARAMS.N ||
    parsed.params.r !== CURRENT_PARAMS.r ||
    parsed.params.p !== CURRENT_PARAMS.p
  );
}
