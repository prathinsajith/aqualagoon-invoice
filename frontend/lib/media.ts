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
