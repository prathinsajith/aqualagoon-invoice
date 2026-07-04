import Image from "next/image";
import Link from "next/link";
import Social from "@/components/Social";
import { NAV, BRAND, SERVICE_AREA_TEXT } from "@/lib/constants";
import type { ContactContent } from "@/lib/site-content";

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
              A swimming pool &amp; wellness centre in Kayamkulam, Kerala. Safe splashes and happy memories for the whole
              family.
            </p>
            <p className="footer-area">{SERVICE_AREA_TEXT}</p>
            <Social social={social} wrapperClass="footer-social" />
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
