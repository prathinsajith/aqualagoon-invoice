import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSiteContent, contentImage } from "@/lib/site-content";
import { SITE_URL } from "@/lib/env";
import { BRAND, ORG_TYPE, MAPS } from "@/lib/constants";

export const viewport: Viewport = {
  themeColor: "#0c3b63",
};

export async function generateMetadata(): Promise<Metadata> {
  const { branding } = await getSiteContent();
  const ogImage = contentImage(branding.ogImageUrl);
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: branding.metaTitle,
      template: `%s`,
    },
    description: branding.metaDescription,
    alternates: { canonical: "/" },
    icons: { icon: contentImage(branding.logoUrl), apple: contentImage(branding.logoUrl) },
    openGraph: {
      type: "website",
      siteName: BRAND.name,
      url: SITE_URL,
      title: branding.metaTitle,
      description: branding.metaDescription,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: branding.metaTitle,
      description: branding.metaDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { branding, contact } = await getSiteContent();
  const logoUrl = contentImage(branding.logoUrl);

  // Structured data (helps Google understand & richly display the business).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ORG_TYPE,
    name: BRAND.name,
    description: branding.metaDescription,
    url: SITE_URL,
    logo: contentImage(branding.logoUrl),
    image: contentImage(branding.ogImageUrl),
    telephone: contact.phone,
    email: contact.email,
    address: { "@type": "PostalAddress", streetAddress: contact.address },
    hasMap: MAPS.link,
    openingHours: [contact.hoursWeekday, contact.hoursSunday].filter(Boolean),
    sameAs: [contact.social.facebook, contact.social.instagram, contact.social.x, contact.social.youtube].filter(
      (u) => u && u !== "#",
    ),
  };

  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="page-shell">
          <Header logoUrl={logoUrl} />
          <main>{children}</main>
          <Footer logoUrl={logoUrl} contact={contact} />
        </div>
      </body>
    </html>
  );
}
