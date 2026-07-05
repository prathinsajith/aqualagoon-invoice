import { env } from "../config/env.js";

export type RevalidateTag = "site-content" | "gallery" | "all";

/**
 * Tell the marketing website to refresh its cached pages after a content or
 * gallery change (see the site's /api/revalidate route). Best-effort and
 * non-blocking: failures are logged, never thrown, and it no-ops unless both
 * WEBSITE_REVALIDATE_URL and REVALIDATE_SECRET are configured.
 */
export async function revalidateWebsite(tag: RevalidateTag): Promise<void> {
  if (!env.revalidateEnabled) return;
  try {
    const res = await fetch(env.WEBSITE_REVALIDATE_URL as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": env.REVALIDATE_SECRET as string,
      },
      body: JSON.stringify({ tag }),
      // Don't let a slow/unreachable site hang the admin request.
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      console.error(`[revalidate] website returned ${res.status} for tag "${tag}"`);
    }
  } catch (error) {
    console.error(`[revalidate] failed to revalidate "${tag}":`, error);
  }
}
