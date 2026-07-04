/**
 * Backend API origin. Used server-side (in the Gallery Server Component) to
 * fetch published gallery images, and to resolve relative media URLs the API
 * returns (e.g. "/api/files/gallery/<key>").
 *
 * Set NEXT_PUBLIC_API_URL in the environment; falls back to the local backend.
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800").replace(/\/+$/, "");

/**
 * Public origin of this website — used for canonical URLs, sitemap, robots and
 * Open Graph. Defaults to the production domain so those stay correct even if
 * NEXT_PUBLIC_SITE_URL is ever missing in prod; falls back to localhost in dev.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production" ? "https://aqualagoon.in" : "http://localhost:3333")
).replace(/\/+$/, "");

/** Prefixes a relative API path with the backend origin; passes absolute URLs through. */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}
