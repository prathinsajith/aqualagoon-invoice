import Image from "next/image";
import Link from "next/link";
import { NAV, BRAND } from "@/lib/constants";
import type { ContactContent } from "@/lib/site-content";

// Only render social icons that point somewhere real ("#" is the unset default).
const hasUrl = (u?: string) => Boolean(u && u !== "#");

export default function Footer({
  logoUrl = "/assets/logo-160.webp",
  contact,
}: {
  logoUrl?: string;
  contact: ContactContent;
}) {
  const social = contact.social;
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer-watermark" aria-hidden="true">
        {BRAND.shortName}
      </div>
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-brand">
              <div className="logo-box">
                <Image src={logoUrl} alt={`${BRAND.name} logo`} width={52} height={52} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                <span className="name">{BRAND.shortName}</span>
                <span className="tag">{BRAND.tagline}</span>
              </div>
            </div>
            <p>
              Swimming pool, kids&apos; water park &amp; wellness centre. Safe splashes and happy memories for the whole
              family.
            </p>
            <div className="footer-social">
              {hasUrl(social.facebook) && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="#0c3b63"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                </a>
              )}
              {hasUrl(social.instagram) && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0c3b63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="#0c3b63" stroke="none" /></svg>
                </a>
              )}
              {hasUrl(social.x) && (
                <a href={social.x} target="_blank" rel="noopener noreferrer" aria-label="X">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#0c3b63"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-7-6.2 7H1.4l8.1-9.3L1 2h7l4.9 6.4L18.9 2z" /></svg>
                </a>
              )}
              {hasUrl(social.youtube) && (
                <a href={social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0c3b63"><path d="M23 12s0-3.5-.46-5.2a2.6 2.6 0 0 0-1.83-1.84C18.9 4.5 12 4.5 12 4.5s-6.9 0-8.71.46A2.6 2.6 0 0 0 1.46 6.8 27 27 0 0 0 1 12a27 27 0 0 0 .46 5.2 2.6 2.6 0 0 0 1.83 1.84C5.1 19.5 12 19.5 12 19.5s6.9 0 8.71-.46a2.6 2.6 0 0 0 1.83-1.84C23 15.5 23 12 23 12zM9.75 15.02V8.98L15.5 12z" /></svg>
                </a>
              )}
            </div>
            <div className="footer-contact">
              <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7fa9c4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>{contact.phone}</span>
              <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7fa9c4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>{contact.email}</span>
              <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7fa9c4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>{contact.address}</span>
            </div>
          </div>

          <div className="footer-center">
            <div className="footer-deco-dots" />
            <div className="footer-deco-l" />
            <Link href="/contact?intent=book" className="footer-book">
              Book Now
            </Link>
            <div className="footer-deco-r" />
            <div className="footer-deco-dots" />
          </div>

          <div className="footer-links">
            <div className="links">
              {NAV.map((n) => (
                <Link key={n.id} href={n.href}>
                  {n.label}
                </Link>
              ))}
            </div>
            <div className="hours-title">Hours</div>
            <div className="hours">
              {contact.hoursWeekday}
              <br />
              {contact.hoursSunday}
            </div>
          </div>
        </div>

        <div className="footer-bar">
          {/* Plain text until real policy pages exist — placeholder "#" links trap keyboard users. */}
          <span>Privacy Policy</span>
          <span className="copy">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5b7d92" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M14.8 9.3a4 4 0 1 0 0 5.4" strokeLinecap="round" /></svg>
            {year} {BRAND.name}. All Rights Reserved.
          </span>
          <span>Terms of Use</span>
        </div>
      </div>
    </footer>
  );
}
