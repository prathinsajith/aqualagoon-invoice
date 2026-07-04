import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Pre-launch gate — Next.js 16 `proxy` convention (the `middleware` file
 * convention was renamed to `proxy` in v16).
 *
 * When `SITE_COMING_SOON=true`, every visitor is served the `/coming-soon`
 * holding page regardless of the URL they requested (a rewrite, so their
 * deep link is preserved for when the gate is turned off again). Flip the
 * env var and redeploy to switch the whole site on/off — no separate
 * deployment, and the holding page reuses the site's CMS content/branding.
 *
 * Defaults OFF, so with the var unset the site behaves normally.
 */
export function proxy(request: NextRequest) {
  if (process.env.SITE_COMING_SOON !== "true") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Let the holding page itself, framework internals, bundled assets and
  // crawler files through — everything else is rewritten to the holding page.
  if (
    pathname === "/coming-soon" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/assets/") ||
    pathname === "/favicon.ico" ||
    pathname === "/apple-touch-icon.png" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/coming-soon";
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip static assets and image optimization for efficiency; the function
  // above also guards these, but keeping them out of the matcher avoids the
  // proxy running on every asset request.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
