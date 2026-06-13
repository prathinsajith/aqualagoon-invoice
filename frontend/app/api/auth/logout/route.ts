import { NextResponse } from "next/server";

/**
 * Clears the refresh-token cookie. The access token is held only in memory on
 * the client, so dropping the cookie is all that's needed to end the session.
 */
export async function POST() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete("refresh_token");
    return response;
}
