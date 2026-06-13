import { randomBytes } from "node:crypto";
import { Conflict } from "./errors.js";

/**
 * Generates a unique, human-friendly code like "CAT-A1B2C3" or "SKU-9F3A21",
 * retrying on collision. `exists` should report whether a candidate is already
 * taken (checked against the relevant table).
 */
export async function generateUniqueCode(
  prefix: string,
  exists: (code: string) => Promise<boolean>,
): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = `${prefix}-${randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;
    if (!(await exists(code))) return code;
  }
  throw Conflict(`Could not allocate a unique ${prefix} code, please retry`);
}
