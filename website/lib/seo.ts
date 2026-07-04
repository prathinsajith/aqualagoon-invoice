import type { Metadata } from "next";
import { BRAND, ORG_TYPE, LOCATION } from "./constants";
import { SITE_URL } from "./env";

/** Bundled 1200×630 share card (hero + logo + brand name). */
export const DEFAULT_OG_IMAGE = "/assets/og-image.jpg";

/** Stable identifier for the business entity — lets other schema reference it. */
export const BUSINESS_ID = `${SITE_URL}/#business`;

/** BreadcrumbList JSON-LD from a Home→…→page trail (paths are made absolute). */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${SITE_URL}${t.path}`,
    })),
  };
}

/** Service JSON-LD for a single program page, tied to the business + area. */
export function serviceJsonLd({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    serviceType: title,
    description,
    url: `${SITE_URL}/services/${id}`,
    provider: { "@type": ORG_TYPE, "@id": BUSINESS_ID, name: BRAND.name, url: SITE_URL },
    areaServed: LOCATION.areasServed.map((name) => ({ "@type": "Place", name })),
  };
}

/**
 * Complete per-page metadata: canonical URL + full Open Graph + Twitter card.
 * Relative `path`/image URLs are made absolute by the `metadataBase` set in
 * the root layout, so every page shares with its own static URL and image.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  /** Route path, e.g. "/about" — becomes the canonical + og:url. */
  path: string;
  /** Optional page-specific share image; falls back to the branded card. */
  image?: string;
}): Metadata {
  const ogImage = image || DEFAULT_OG_IMAGE;
  // Width/height are only known for the bundled card.
  const ogImages =
    ogImage === DEFAULT_OG_IMAGE
      ? [{ url: ogImage, width: 1200, height: 630, alt: `${BRAND.name} — ${BRAND.tagline}` }]
      : [{ url: ogImage, alt: title }];

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: BRAND.name,
      locale: "en_IN",
      url: path,
      title,
      description,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
