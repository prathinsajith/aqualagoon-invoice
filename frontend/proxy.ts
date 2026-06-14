import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth route-gate — Next.js 16 `proxy` convention (the `middleware` file
 * convention was renamed to `proxy` in v16; see
 * https://nextjs.org/docs/app/api-reference/file-conventions/proxy).
 *
 * This is a UX redirect only, NOT a security boundary: it bounces visitors who
 * have no `refresh_token` cookie to /login. Real authorization is enforced
 * server-side on every backend call (bearer token + per-route permission
 * checks), and each page additionally gates with <PermissionPage>. Per the
 * Next.js docs, never rely on the proxy alone for access control.
 *
 * The `matcher` is an explicit allow-list of protected route trees, so the
 * proxy only ever runs on authenticated pages — never on public routes
 * (/login, /forgot-password, …) or on static assets (`_next/*`, `public/`),
 * which means this gate can't accidentally block CSS/JS/images.
 */
export function proxy(request: NextRequest) {
  // `refresh_token` is an HTTP-only cookie set at path "/", so it's readable
  // here for every matched route.
  if (request.cookies.get("refresh_token")) {
    return NextResponse.next();
  }

  // Not signed in → redirect to login, preserving the intended destination so
  // the user can be returned there after a successful sign-in.
  const loginUrl = new URL("/login", request.url);
  const { pathname, search } = request.nextUrl;
  if (pathname !== "/") {
    loginUrl.searchParams.set("next", `${pathname}${search}`);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Only run on protected route trees (keeps the proxy off public pages and
  // static assets). Add new protected top-level routes here.
  matcher: [
    "/dashboard/:path*",
    "/calendar/:path*",
    "/status/:path*",
    "/settings/:path*",
    "/company/:path*",
    "/profile/:path*",
    "/users/:path*",
    "/roles/:path*",
    "/products/:path*",
    "/product-categories/:path*",
    "/billing/:path*",
    "/invoices/:path*",
    "/passes/:path*",
    "/pass-types/:path*",
    "/training-types/:path*",
    "/training-programs/:path*",
    "/fee-plans/:path*",
    "/batches/:path*",
    "/enrollments/:path*",
    "/attendance/:path*",
    "/student-fees/:path*",
    "/audit-logs/:path*",
  ],
};
