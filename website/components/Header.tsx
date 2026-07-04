"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, activeNavId, BRAND } from "@/lib/constants";

export default function Header({ logoUrl = "/assets/logo.jpeg" }: { logoUrl?: string }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const activeId = activeNavId(pathname);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || document.documentElement.scrollTop || 0) > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const showOverlay = isHome && !scrolled;

  const burger = (stroke: string) => (
    <button
      className="burger"
      type="button"
      aria-label={menuOpen ? "Close menu" : "Open menu"}
      aria-expanded={menuOpen}
      onClick={() => setMenuOpen((o) => !o)}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round">
        <path d="M3 6h18" />
        <path d="M3 12h18" />
        <path d="M3 18h18" />
      </svg>
    </button>
  );

  const mobileMenu = (ctaLabel: string) => (
    <div className={`mobile-menu${menuOpen ? " is-open" : ""}`}>
      {NAV.map((n) => (
        <Link key={n.id} href={n.href} className={`m-link${n.id === activeId ? " is-active" : ""}`}>
          <span className="dot" />
          {n.label}
        </Link>
      ))}
      <Link href="/contact?intent=book" className="m-cta">
        {ctaLabel}
      </Link>
    </div>
  );

  if (showOverlay) {
    return (
      <header className="site-header header-overlay">
        <div className="nav-shell">
          <div className="nav-bar">
            <Link href="/" className="brand" aria-label={`${BRAND.name} home`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="brand-logo" src={logoUrl} alt={`${BRAND.name} logo`} />
              <span className="brand-word">{BRAND.name}</span>
            </Link>
            <nav className="nav-links" aria-label="Primary">
              {NAV.map((n) => (
                <Link key={n.id} href={n.href} className={`nav-link${n.id === activeId ? " is-active" : ""}`}>
                  <span className="dot" />
                  {n.label}
                </Link>
              ))}
            </nav>
            <Link href="/contact" className="link-contact">
              Contact Us
            </Link>
            {burger("#fff")}
          </div>
        </div>
        {mobileMenu("Book Now")}
      </header>
    );
  }

  return (
    <header className={`site-header header-solid${scrolled ? " is-fixed" : ""}`}>
      <div className="solid-bar">
        <div className="bar-inner">
          <Link href="/" className="brand brand-solid" aria-label={`${BRAND.name} home`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brand-logo" src={logoUrl} alt={`${BRAND.name} logo`} />
            <span className="brand-stack">
              <span className="name">{BRAND.shortName}</span>
              <span className="tag">{BRAND.tagline}</span>
            </span>
          </Link>
          <nav className="nav-links" aria-label="Primary">
            {NAV.map((n) => (
              <Link key={n.id} href={n.href} className={`nav-link${n.id === activeId ? " is-active" : ""}`}>
                <span className="dot" />
                {n.label}
              </Link>
            ))}
          </nav>
          <Link href="/contact?intent=book" className="cta-quote">
            Book Now
          </Link>
          {burger("#1479cf")}
        </div>
        {mobileMenu("Book Now")}
      </div>
    </header>
  );
}
