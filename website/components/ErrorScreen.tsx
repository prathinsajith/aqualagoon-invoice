import type { ReactNode } from "react";
import Image from "next/image";
import { BRAND } from "@/lib/constants";

/**
 * Full-bleed hero shell used by the 404 and error screens: pool photo,
 * gradient wash, floating bubbles, animated waves and a centered glass card.
 * Fixed to the viewport so it covers the site header/footer for a standalone look.
 */
export default function ErrorScreen({
  wide = false,
  stackedBrand = false,
  bg = "/assets/hero.webp",
  children,
}: {
  /** Roomier card (used by the 404 layout). */
  wide?: boolean;
  /** Show the tagline under the wordmark (404) vs. wordmark only (error). */
  stackedBrand?: boolean;
  /** Background photo — pass the CMS hero image so it matches the homepage. */
  bg?: string;
  children: ReactNode;
}) {
  const logoSize = stackedBrand ? 44 : 40;
  return (
    <div className="err-wrap">
      <div className="err-bg" aria-hidden="true" style={{ backgroundImage: `url(${bg})` }} />
      <div className="err-overlay" aria-hidden="true" />
      <div className="err-bubble b1" aria-hidden="true" />
      <div className="err-bubble b2" aria-hidden="true" />
      <div className="err-waves" aria-hidden="true">
        <svg className="w1" viewBox="0 0 2880 120" preserveAspectRatio="none">
          <path d="M0,60 C240,110 480,110 720,60 C960,10 1200,10 1440,60 C1680,110 1920,110 2160,60 C2400,10 2640,10 2880,60 L2880,120 L0,120 Z" fill="#2bc0e8" />
        </svg>
        <svg className="w2" viewBox="0 0 2880 120" preserveAspectRatio="none">
          <path d="M0,80 C240,35 480,35 720,80 C960,125 1200,125 1440,80 C1680,35 1920,35 2160,80 C2400,125 2640,125 2880,80 L2880,120 L0,120 Z" fill="#0c3b63" />
        </svg>
      </div>

      <div className={`err-card${wide ? " wide" : ""}`}>
        <div className="err-brand">
          <span className="err-logo-box">
            <Image className="err-logo" src="/assets/logo-160.webp" alt={`${BRAND.name} logo`} width={logoSize} height={logoSize} />
          </span>
          {stackedBrand ? (
            <span className="err-brand-stack">
              <span className="name">{BRAND.shortName}</span>
              <span className="tag">{BRAND.tagline}</span>
            </span>
          ) : (
            <span className="name">{BRAND.shortName}</span>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
