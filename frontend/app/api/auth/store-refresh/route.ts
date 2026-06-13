import { NextResponse } from "next/server";

/** Stores the refresh token returned by login as an HTTP-only cookie. */
export async function POST(req: Request) {
    const body = await req.json();
    const refreshToken = body.refreshToken ?? body.refresh_token;

    const res = NextResponse.json({ success: true });

    if (refreshToken) {
        res.cookies.set("refresh_token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });
    }

    return res;
}
