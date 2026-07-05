import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSiteContent, contentImage } from "@/lib/site-content";
import { API_URL, SITE_URL } from "@/lib/env";
import { BRAND, ORG_TYPE, MAPS, LOCATION } from "@/lib/constants";

export const viewport: Viewport = {
  themeColor: "#0c3b63",
};

// Self-hosted via next/font — no render-blocking Google Fonts request, no layout shift.
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { branding } = await getSiteContent();
  // Always ship a share image — WhatsApp/Facebook/X previews look broken without
  // one. Falls back to the bundled 1200×630 card (hero + logo + brand name).
  const ogImage = contentImage(branding.ogImageUrl) || "/assets/og-image.jpg";
  const icon = contentImage(branding.logoUrl) || "/assets/logo-160.webp";
  // Search-engine ownership verification. Codes are public (they render in the
  // page <head>), so the Google one is baked in as the default; either can be
  // overridden via env.
  const googleVerification =
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "9cgrNg8rXfcGvGVnQ61qP8NOCaOf2PrRStYisoQp2uM";
  const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: BRAND.name,
    verification: {
      ...(googleVerification ? { google: googleVerification } : {}),
      ...(bingVerification ? { other: { "msvalidate.01": bingVerification } } : {}),
    },
    title: {
      default: branding.metaTitle,
      template: `%s`,
    },
    description: branding.metaDescription,
    alternates: { canonical: "/" },
    icons: {
      icon,
      shortcut: icon,
      apple: "/assets/apple-touch-icon.png",
    },
    openGraph: {
      type: "website",
      siteName: BRAND.name,
      locale: "en_IN",
      url: SITE_URL,
      title: branding.metaTitle,
      description: branding.metaDescription,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${BRAND.name} — ${BRAND.tagline}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: branding.metaTitle,
      description: branding.metaDescription,
      images: [ogImage],
    },
  };
}

// JSON-LD consumers want absolute URLs; bundled `/assets/*` paths are site-relative.
const absUrl = (u: string) => (u.startsWith("/") ? `${SITE_URL}${u}` : u);

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { branding, contact } = await getSiteContent();
  const logoUrl = contentImage(branding.logoUrl) || "/assets/logo-160.webp";
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID || "xhc2qttknk";
  const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-TCDGT6KBQQ";

  // Structured data (helps Google understand & richly display the business).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ORG_TYPE,
    "@id": `${SITE_URL}/#business`,
    name: BRAND.name,
    description: branding.metaDescription,
    url: SITE_URL,
    logo: absUrl(logoUrl),
    image: absUrl(contentImage(branding.ogImageUrl) || "/assets/og-image.jpg"),
    telephone: contact.phone,
    email: contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address,
      addressLocality: LOCATION.locality,
      addressRegion: LOCATION.region,
      postalCode: LOCATION.postalCode,
      addressCountry: LOCATION.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: LOCATION.geo.latitude, longitude: LOCATION.geo.longitude },
    hasMap: MAPS.link,
    // The towns this pool serves — the local searches we want to rank for.
    areaServed: LOCATION.areasServed.map((name) => ({ "@type": "Place", name })),
    priceRange: "₹₹",
    openingHours: [contact.hoursWeekday, contact.hoursSunday].filter(Boolean),
    sameAs: [
      contact.social.facebook,
      contact.social.instagram,
      contact.social.x,
      contact.social.youtube,
      contact.social.whatsapp,
    ].filter((u) => u && u !== "#"),
  };

  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`} data-scroll-behavior="smooth">
      <head>
        {/* Uploaded content images are served by the backend — warm the connection early. */}
        <link rel="preconnect" href={API_URL} crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          // JSON.stringify doesn't HTML-escape — encode `<` so CMS text can't
          // break out of the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      </head>
      <body>
        <div className="page-shell">
          <Header logoUrl={logoUrl} />
          <main>{children}</main>
          <Footer logoUrl={logoUrl} contact={contact} />
        </div>
        {/* Microsoft Clarity — heatmaps + session recordings (analytics only, no SEO
            impact). Loads after the page is interactive so it never blocks render.
            Project ID is env-overridable; falls back to the live project. */}
        {clarityId ? (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`}
          </Script>
        ) : null}
        {/* Google Analytics 4 — visitor counts, traffic sources, conversions.
            Loads after interactive so it never blocks render. ID env-overridable. */}
        {gaId ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
