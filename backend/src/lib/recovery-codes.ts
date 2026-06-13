import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";

/**
 * 2FA recovery codes. Codes are high-entropy random strings shown to the user
 * exactly once; only a peppered HMAC of each is persisted. Verification
 * normalises user input (case + separators) and compares in constant time.
 */

// Unambiguous alphabet — no 0/O, 1/I/L to avoid transcription mistakes.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const GROUP = 5; // characters per group
const GROUPS = 2; // groups per code  → "ABCDE-FGHJK"
export const RECOVERY_CODE_COUNT = 10;

/** Generates `count` formatted recovery codes (e.g. "ABCDE-FGHJK"). */
export function generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const groups: string[] = [];
    for (let g = 0; g < GROUPS; g++) {
      let group = "";
      for (let c = 0; c < GROUP; c++) {
        group += ALPHABET[randomInt(ALPHABET.length)];
      }
      groups.push(group);
    }
    codes.push(groups.join("-"));
  }
  return codes;
}

/** Strips separators/whitespace and upper-cases so display format is irrelevant. */
export function normalizeRecoveryCode(code: string): string {
  return code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/** Peppered HMAC-SHA256 of a normalised code, hex-encoded. */
export function hashRecoveryCode(code: string): string {
  return createHmac("sha256", env.JWT_REFRESH_SECRET)
    .update(normalizeRecoveryCode(code))
    .digest("hex");
}

/** Constant-time check that a candidate hash matches one of the stored hashes. */
export function matchRecoveryCode(candidate: string, storedHash: string): boolean {
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
