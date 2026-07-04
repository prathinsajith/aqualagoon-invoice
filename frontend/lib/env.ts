/**
 * Environment configuration.
 *
 * The API base URL comes from `NEXT_PUBLIC_API_URL`, which Next inlines into
 * the client bundle at BUILD time. If it isn't set we fall back to a sane
 * default per environment instead of throwing — a missing var must never crash
 * the whole React tree (that surfaces as a blank "Something went wrong" page).
 */

// Standard local-development default. Production MUST provide
// NEXT_PUBLIC_API_URL via the environment (see .env.production) — there is no
// hardcoded production URL in source.
const DEVELOPMENT_API_FALLBACK = "http://localhost:8800";

const isProd = process.env.NODE_ENV === "production";
const isDev = process.env.NODE_ENV === "development";

function resolveApiUrl(): string {
    const value = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (value) return value.replace(/\/+$/, ""); // drop any trailing slash

    // Never throw — a missing var must not crash the whole React tree. Warn
    // loudly (build/SSR logs) and fall back to localhost so the app renders;
    // API calls will then fail until NEXT_PUBLIC_API_URL is set + rebuilt.
    if (typeof window === "undefined" && process.env.NODE_ENV !== "test") {
        const log = isProd ? console.error : console.warn;
        log(
            `${isProd ? "✖" : "⚠️"}  NEXT_PUBLIC_API_URL is not set` +
            `${isProd ? " in a production build" : ""} — falling back to ${DEVELOPMENT_API_FALLBACK}.\n` +
            `   Set it in your deployment's environment variables and rebuild.`
        );
    }

    return DEVELOPMENT_API_FALLBACK;
}

export const env = {
    // API Configuration
    apiUrl: resolveApiUrl(),

    // Environment
    nodeEnv: process.env.NODE_ENV ?? "development",
    isProd,
    isDev,
} as const;
