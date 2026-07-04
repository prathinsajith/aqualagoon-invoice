import type { Metadata } from "next";
import Link from "next/link";
import ErrorScreen from "@/components/ErrorScreen";
import { getSiteContent, contentImage } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Page not found — Aqua Lagoon",
  description: "The page you're looking for has floated away.",
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const { homepage } = await getSiteContent();
  return (
    <ErrorScreen wide stackedBrand bg={contentImage(homepage.heroImageUrl) || "/assets/hero.webp"}>
      <div className="err-404" role="img" aria-label="Error 404 — page not found">
        <span className="digit" aria-hidden="true">4</span>
        <span className="ring" aria-hidden="true">
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#ff6b6b" strokeWidth="9" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#ffd43b" strokeWidth="9" strokeDasharray="18 20" strokeLinecap="round" />
            <circle cx="50" cy="50" r="24" fill="rgba(255,255,255,.14)" />
            <circle cx="50" cy="50" r="8" fill="none" stroke="#fff" strokeWidth="5" />
          </svg>
        </span>
        <span className="digit" aria-hidden="true">4</span>
      </div>

      <h1 className="err-title">You&apos;ve drifted off course</h1>
      <p className="err-text">
        The page you&apos;re looking for has floated away. Let&apos;s get you back to shallow water.
      </p>

      <div className="err-actions">
        <Link href="/" className="err-btn err-btn-solid">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>
          Back to home
        </Link>
        <Link href="/contact" className="err-btn err-btn-ghost">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
          Contact us
        </Link>
      </div>
    </ErrorScreen>
  );
}
