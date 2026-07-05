import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * On-demand cache revalidation. The backend calls this after content or gallery
 * changes so edits appear immediately even though pages are cached (ISR).
 *
 * POST /api/revalidate  { "tag": "site-content" | "gallery" | "all" }
 * Auth: `x-revalidate-secret` header (or `?secret=`) must equal REVALIDATE_SECRET.
 * If REVALIDATE_SECRET is unset, revalidation is disabled (503) so it can't be
 * abused before it's configured.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Revalidation not configured" }, { status: 503 });
  }

  const provided = request.headers.get("x-revalidate-secret") ?? request.nextUrl.searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let tag: string | undefined;
  try {
    tag = (await request.json())?.tag;
  } catch {
    tag = request.nextUrl.searchParams.get("tag") ?? undefined;
  }

  // Site content (branding, hero, services, contact…) appears on every page, so
  // purge the whole tree; gallery images only render on /gallery.
  const revalidated: string[] = [];
  if (!tag || tag === "all" || tag === "site-content") {
    revalidatePath("/", "layout");
    revalidated.push("/*");
  }
  if (tag === "gallery") {
    revalidatePath("/gallery");
    revalidated.push("/gallery");
  } else if (tag && tag !== "all" && tag !== "site-content") {
    return NextResponse.json({ ok: false, error: `Unknown tag: ${tag}` }, { status: 400 });
  }

  return NextResponse.json({ ok: true, revalidated });
}
