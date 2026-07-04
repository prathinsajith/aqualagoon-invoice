"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ErrorScreen from "@/components/ErrorScreen";
import { API_URL } from "@/lib/env";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Match the homepage hero photo (CMS-driven). Best-effort — this is an error
  // state, so any failure just keeps the bundled fallback.
  const [bg, setBg] = useState("/assets/hero.webp");
  useEffect(() => {
    fetch(`${API_URL}/api/site-content`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const url: unknown = j?.data?.homepage?.heroImageUrl;
        if (typeof url === "string" && url.startsWith("/assets/")) setBg(url);
        else if (typeof url === "string" && url.startsWith("/")) setBg(`${API_URL}${url}`);
      })
      .catch(() => {});
  }, []);

  return (
    <ErrorScreen bg={bg}>
      <div className="err-badge" aria-hidden="true">
        <svg width="48%" height="48%" viewBox="0 0 24 24" fill="none" stroke="#ff9a9a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </div>

      <div className="err-code">ERROR 500</div>
      <h1 className="err-title">Something went underwater</h1>
      <p className="err-text">
        Our end hit a snag. Take a breath and try again — if it keeps happening, give us a call and we&apos;ll sort it out.
      </p>

      <div className="err-actions">
        <button type="button" className="err-btn err-btn-solid" onClick={() => reset()}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>
          Try again
        </button>
        <Link href="/" className="err-btn err-btn-ghost">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>
          Back to home
        </Link>
      </div>
    </ErrorScreen>
  );
}
