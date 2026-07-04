import type { Metadata } from "next";
import ErrorScreen from "@/components/ErrorScreen";
import Countdown from "@/components/Countdown";
import { getSiteContent, contentImage } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Coming Soon — Aqua Lagoon",
  description:
    "A whole new home for water & wellness is almost here — swimming lessons, yoga, zumba and our mini auditorium.",
  robots: { index: false, follow: false },
};

/** Launch moment for the countdown — override per deploy without a code change. */
const LAUNCH_DATE = process.env.NEXT_PUBLIC_LAUNCH_DATE || "2026-09-01T09:00:00";

const hasUrl = (u?: string) => Boolean(u && u !== "#");

export default async function ComingSoonPage() {
  const { homepage, contact } = await getSiteContent();
  const social = [
    {
      label: "Facebook",
      href: contact.social.facebook,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>,
    },
    {
      label: "Instagram",
      href: contact.social.instagram,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none" /></svg>,
    },
    {
      label: "X",
      href: contact.social.x,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-7-6.2 7H1.4l8.1-9.3L1 2h7l4.9 6.4L18.9 2z" /></svg>,
    },
  ].filter((s) => hasUrl(s.href));

  return (
    <ErrorScreen wide stackedBrand bg={contentImage(homepage.heroImageUrl) || "/assets/hero.webp"}>
      <div className="cs-title-wrap">
        <h1 className="cs-title">Coming Soon</h1>
        <h1 className="cs-title is-wave" aria-hidden="true">Coming Soon</h1>
      </div>

      <p className="cs-text">
        We&apos;re getting the water just right. Swimming lessons, yoga, zumba and our mini auditorium — a whole new
        home for water &amp; wellness is almost here.
      </p>

      <Countdown target={LAUNCH_DATE} />

      <div className="cs-meta">
        <div className="cs-social">
          {social.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
              {s.icon}
            </a>
          ))}
        </div>
        <div className="cs-contact">
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8fd0ec" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            {contact.phone}
          </span>
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8fd0ec" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
            {contact.email}
          </span>
        </div>
      </div>
    </ErrorScreen>
  );
}
