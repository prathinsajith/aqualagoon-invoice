import { env } from "@/lib/env";

/**
 * Resolves a stored media path to a browser-loadable URL. Absolute http(s) URLs
 * (e.g. S3) pass through; relative paths (e.g. "/uploads/…") are prefixed with
 * the API origin. Returns undefined for empty input.
 */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
    if (!url) return undefined;
    return url.startsWith("http") ? url : `${env.apiUrl}${url}`;
}

function hostOf(url: string): string {
    try {
        return new URL(url).host;
    } catch {
        return "";
    }
}

const API_HOST = hostOf(env.apiUrl);
const MEDIA_HOST = process.env.NEXT_PUBLIC_MEDIA_HOST
    ? hostOf(
          process.env.NEXT_PUBLIC_MEDIA_HOST.startsWith("http")
              ? process.env.NEXT_PUBLIC_MEDIA_HOST
              : `https://${process.env.NEXT_PUBLIC_MEDIA_HOST}`,
      )
    : "";

/**
 * Private / loopback hosts can't be optimized: Next refuses to fetch images
 * that resolve to a private IP (SSRF guard), so a localhost backend in dev must
 * render unoptimized.
 */
function isPrivateHost(host: string): boolean {
    const name = host.split(":")[0];
    return (
        name === "localhost" ||
        name === "127.0.0.1" ||
        name === "::1" ||
        name.endsWith(".local") ||
        /^10\./.test(name) ||
        /^192\.168\./.test(name) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(name)
    );
}

/**
 * Whether the Next image optimizer is allowed to fetch + resize this URL — must
 * stay in sync with `images.remotePatterns` in next.config.ts. Unknown or
 * private hosts render via `unoptimized` so they never 400 or break.
 */
export function isOptimizableMedia(url: string | null | undefined): boolean {
    if (!url) return false;
    const h = hostOf(url);
    if (!h || isPrivateHost(h)) return false;
    return h === API_HOST || h.endsWith(".amazonaws.com") || (MEDIA_HOST !== "" && h === MEDIA_HOST);
}
