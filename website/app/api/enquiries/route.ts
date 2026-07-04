import { NextResponse } from "next/server";
import { API_URL } from "@/lib/env";

/**
 * Same-origin proxy for the public enquiry form. The browser POSTs here; we
 * forward to the backend server-side so there's no CORS dependency and the API
 * origin stays private.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_URL}/api/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Could not submit right now. Please call us instead." },
      { status: 502 },
    );
  }
}
