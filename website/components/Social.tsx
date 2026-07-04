import type { ReactNode } from "react";
import type { SocialLinks } from "@/lib/site-content";

/** Icons use `currentColor` so the link's CSS controls fill/stroke + hover. */
const ICONS: Record<keyof SocialLinks, ReactNode> = {
  facebook: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
  ),
  instagram: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
  ),
  x: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-7-6.2 7H1.4l8.1-9.3L1 2h7l4.9 6.4L18.9 2z" /></svg>
  ),
  youtube: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.5-.46-5.2a2.6 2.6 0 0 0-1.83-1.84C18.9 4.5 12 4.5 12 4.5s-6.9 0-8.71.46A2.6 2.6 0 0 0 1.46 6.8 27 27 0 0 0 1 12a27 27 0 0 0 .46 5.2 2.6 2.6 0 0 0 1.83 1.84C5.1 19.5 12 19.5 12 19.5s6.9 0 8.71-.46a2.6 2.6 0 0 0 1.83-1.84C23 15.5 23 12 23 12zM9.75 15.02V8.98L15.5 12z" /></svg>
  ),
  whatsapp: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15s-.77.96-.94 1.16-.35.22-.64.07a8.13 8.13 0 0 1-2.4-1.47 9 9 0 0 1-1.65-2.06c-.17-.3 0-.46.13-.6.13-.14.3-.35.44-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57a1.1 1.1 0 0 0-.8.37c-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.11.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.27-.2-.57-.34m-5.42 7.4a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26C1.17 6.44 5.6 2 11.05 2c2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.89-9.88 9.89M20.52 3.45A11.82 11.82 0 0 0 12.04 0C5.46 0 .1 5.36.1 11.89c0 2.1.55 4.14 1.6 5.95L0 24l6.33-1.65a11.9 11.9 0 0 0 5.7 1.45h.01c6.58 0 11.95-5.36 11.95-11.94a11.86 11.86 0 0 0-3.48-8.41" /></svg>
  ),
};

const ORDER: (keyof SocialLinks)[] = ["facebook", "instagram", "x", "youtube", "whatsapp"];
const LABELS: Record<keyof SocialLinks, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
};

/**
 * Social icon row, rendered wherever social links appear (hero, footer,
 * coming-soon). Only shows links that point somewhere real ("#" = unset).
 * Each icon adopts its platform's brand colour on hover (see `.soc-*` in
 * globals.css). `wrapperClass` sets the layout for the surrounding context.
 */
export default function Social({
  social,
  wrapperClass,
}: {
  social: SocialLinks;
  wrapperClass: string;
}) {
  // Show a network only when it has a real link — hide empty, whitespace-only,
  // or the unset "#" placeholder.
  const links = ORDER.filter((k) => {
    const v = social[k]?.trim();
    return v && v !== "#";
  });
  if (links.length === 0) return null;
  return (
    <div className={wrapperClass}>
      {links.map((k) => (
        <a
          key={k}
          href={social[k]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={LABELS[k]}
          className={`soc soc-${k}`}
        >
          {ICONS[k]}
        </a>
      ))}
    </div>
  );
}
