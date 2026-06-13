import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Minimal, dependency-free TOTP (RFC 6238 / RFC 4226) — SHA1, 6 digits, 30s
 * period — compatible with Google Authenticator, Authy, 1Password, etc.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const DIGITS = 6;
const PERIOD = 30; // seconds

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

/** Generates a new random base32 TOTP secret. */
export function generateSecret(): string {
  return base32Encode(randomBytes(20));
}

/** Builds the `otpauth://` URI that authenticator apps scan. */
export function keyUri(accountName: string, issuer: string, secret: string): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(PERIOD),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

function hotp(key: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(buf).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);
  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

/** Generates the current TOTP token for a secret (mainly for tests). */
export function generateToken(secret: string, forTime = Date.now()): string {
  const counter = Math.floor(forTime / 1000 / PERIOD);
  return hotp(base32Decode(secret), counter);
}

/**
 * Verifies a token against a secret, allowing ±`window` periods for clock drift.
 * Constant-time comparison; returns false for malformed tokens.
 */
export function verifyToken(token: string, secret: string, window = 1): boolean {
  const normalized = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;

  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / PERIOD);
  const candidate = Buffer.from(normalized);

  for (let offset = -window; offset <= window; offset++) {
    const expected = Buffer.from(hotp(key, counter + offset));
    if (expected.length === candidate.length && timingSafeEqual(expected, candidate)) {
      return true;
    }
  }
  return false;
}
