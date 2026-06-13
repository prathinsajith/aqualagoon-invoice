import { SignJWT, jwtVerify, errors as joseErrors } from "jose";
import { env } from "../config/env.js";
import { Unauthorized } from "./errors.js";

/**
 * JWT issuing/verification backed by `jose` (HS256). The backend is a stateless
 * bearer API: access tokens arrive in the `Authorization` header and
 * refresh/reset tokens arrive in request bodies (the refresh-token cookie is
 * managed by the Next.js proxy, not here), so we verify raw token strings.
 *
 * Each token type uses its own signing secret, and verification pins the
 * algorithm to HS256 to prevent algorithm-confusion attacks.
 */

export type TokenType = "access" | "refresh" | "reset" | "mfa";

export interface TokenPayload {
  /** Subject — the user id. */
  sub: string;
  type: TokenType;
  /** Token version; must match the user's current `tokenVersion`. */
  ver: number;
  iat?: number;
  exp?: number;
}

const encoder = new TextEncoder();

const SECRETS: Record<TokenType, Uint8Array> = {
  access: encoder.encode(env.JWT_ACCESS_SECRET),
  refresh: encoder.encode(env.JWT_REFRESH_SECRET),
  // Reset + MFA tokens are signed with the refresh secret plus a `type` claim.
  reset: encoder.encode(env.JWT_REFRESH_SECRET),
  mfa: encoder.encode(env.JWT_REFRESH_SECRET),
};

const TTLS: Record<TokenType, string> = {
  access: env.JWT_ACCESS_TTL,
  refresh: env.JWT_REFRESH_TTL,
  reset: env.JWT_RESET_TTL,
  // Short window to complete the 2FA code step after a correct password.
  mfa: "5m",
};

/** Parses a `vercel/ms`-style duration ("15m", "30d", "1h") into seconds. */
function ttlToSeconds(ttl: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(ttl.trim());
  if (!match) throw new Error(`Invalid TTL format: ${ttl}`);
  const value = Number(match[1]);
  const unit = match[2] as "s" | "m" | "h" | "d";
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 } as const;
  return value * multipliers[unit];
}

async function sign(
  type: TokenType,
  payload: Pick<TokenPayload, "sub" | "ver">,
): Promise<{ token: string; expiresIn: number }> {
  const expiresIn = ttlToSeconds(TTLS[type]);
  const token = await new SignJWT({ ver: payload.ver, type })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(SECRETS[type]);
  return { token, expiresIn };
}

async function verify(type: TokenType, token: string): Promise<TokenPayload> {
  let payload;
  try {
    // jose validates the signature, `exp`/`nbf`, and the pinned algorithm.
    ({ payload } = await jwtVerify(token, SECRETS[type], { algorithms: ["HS256"] }));
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) throw Unauthorized("Token expired");
    throw Unauthorized("Invalid token");
  }

  if (payload.type !== type) throw Unauthorized("Unexpected token type");
  if (typeof payload.sub !== "string" || typeof payload.ver !== "number") {
    throw Unauthorized("Malformed token");
  }

  return { sub: payload.sub, type, ver: payload.ver, iat: payload.iat, exp: payload.exp };
}

export const signAccessToken = (sub: string, ver: number) => sign("access", { sub, ver });
export const signRefreshToken = (sub: string, ver: number) => sign("refresh", { sub, ver });
export const signResetToken = (sub: string, ver: number) => sign("reset", { sub, ver });
export const signMfaToken = (sub: string, ver: number) => sign("mfa", { sub, ver });

export const verifyAccessToken = (token: string) => verify("access", token);
export const verifyRefreshToken = (token: string) => verify("refresh", token);
export const verifyResetToken = (token: string) => verify("reset", token);
export const verifyMfaToken = (token: string) => verify("mfa", token);
