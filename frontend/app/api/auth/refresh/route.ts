import { NextRequest, NextResponse } from "next/server";

/**
 * Reads the HTTP-only refresh cookie, exchanges it at the backend for a new
 * token pair, returns the access token to the client, and rotates the cookie.
 */
export async function POST(req: NextRequest) {
    try {
        const refreshToken = req.cookies.get("refresh_token")?.value;

        if (!refreshToken) {
            return NextResponse.json({ error: "No refresh token" }, { status: 401 });
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            const res = NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
            res.cookies.delete("refresh_token");
            return res;
        }

        const body = await response.json();
        const tokens = body.data ?? body;

        const res = NextResponse.json({ token: tokens.accessToken });

        // The backend rotates the refresh token on every refresh.
        if (tokens.refreshToken) {
            res.cookies.set("refresh_token", tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 30,
            });
        }

        return res;
    } catch (error) {
        console.error("Token refresh error:", error);
        return NextResponse.json({ error: "Token refresh failed" }, { status: 500 });
    }
}
