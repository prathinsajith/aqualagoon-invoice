import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon, { IconTile } from "@/components/Icon";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import { AREAS, findArea } from "@/lib/areas";
import { WHYUS } from "@/lib/data";
import { BRAND, ORG_TYPE, LOCATION } from "@/lib/constants";
import { pageMetadata, breadcrumbJsonLd, BUSINESS_ID } from "@/lib/seo";
import { SITE_URL } from "@/lib/env";
import { getSiteContent } from "@/lib/site-content";

export function generateStaticParams() {
  return AREAS.map((a) => ({ area: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ area: string }>;
}): Promise<Metadata> {
  const { area } = await params;
  const a = findArea(area);
  if (!a) return { title: "Areas we serve — Aqua Lagoon" };
  return pageMetadata({
    title: `Swimming Pool in ${a.name} | Aqua Lagoon`,
    description: `Swimming pool & classes for ${a.name}, Kerala. Learn-to-swim coaching for kids & adults, open swims, yoga and zumba at Aqua Lagoon — ${LOCATION.locality}, near ${a.name}.`,
    path: `/areas/${a.slug}`,
  });
}

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const a = findArea(area);
  if (!a) notFound();
  const { services } = await getSiteContent();

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Swimming pool & classes in ${a.name}`,
    serviceType: "Swimming pool, swimming lessons & wellness classes",
    description: a.blurb,
    url: `${SITE_URL}/areas/${a.slug}`,
    provider: { "@type": ORG_TYPE, "@id": BUSINESS_ID, name: BRAND.name, url: SITE_URL },
    areaServed: { "@type": "Place", name: `${a.name}, Kerala` },
  };

  return (
    <div className="route-enter">
      <JsonLd data={serviceLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Areas we serve", path: "/areas" },
          { name: a.name, path: `/areas/${a.slug}` },
        ])}
      />

      <div className="page-hero bg-radial-left">
        <div className="container">
          <Link href="/areas" className="eyebrow" style={{ display: "inline-block", marginBottom: 4 }}>
            ← Areas we serve
          </Link>
          <h1>Swimming Pool in {a.name}</h1>
          <p style={{ maxWidth: 640 }}>{a.blurb}</p>
        </div>
      </div>

      {/* What we offer */}
      <section className="section container">
        <div className="section-head" style={{ maxWidth: 620 }}>
          <span className="eyebrow">For {a.name}</span>
          <h2>Swimming &amp; wellness, close to you</h2>
          <p>Everything at Aqua Lagoon is open to swimmers from {a.name} — lessons, open swims and fitness classes.</p>
        </div>
        <div className="grid-3">
          {services.map((sv) => (
            <Link key={sv.id} href={`/services/${sv.id}`} className="service-card">
              <IconTile name={sv.icon} color={sv.color} tint={sv.tint} size={30} />
              <h3>{sv.title}</h3>
              <p>{sv.blurb}</p>
              <span className="more">Learn more →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Why choose us */}
      <section className="section container" style={{ paddingTop: 20 }}>
        <div className="section-head">
          <span className="eyebrow">Why {a.name} families choose us</span>
          <h2>Safe, clean &amp; welcoming</h2>
        </div>
        <div className="grid-4">
          {WHYUS.map((w) => (
            <div key={w.title} className="audience-card">
              <IconTile name={w.icon} color={w.color} tint={w.tint} size={26} />
              <div className="title">{w.title}</div>
              <p>{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section container">
        <div className="cta-band">
          <div className="wave">
            <svg viewBox="0 0 2880 120" preserveAspectRatio="none"><path d="M0,60 C240,110 480,110 720,60 C960,10 1200,10 1440,60 C1680,110 1920,110 2160,60 C2400,10 2640,10 2880,60 L2880,120 L0,120 Z" fill="#ffffff" /></svg>
          </div>
          <h2>Book your free trial from {a.name}</h2>
          <p>First-time swimmers get a free trial session. Call us or send an enquiry and we&apos;ll help you get started.</p>
          <div className="actions">
            <Link href="/contact?intent=book" className="btn btn-white btn-lg">Book Now</Link>
            <Link href="/contact" className="btn btn-outline-white btn-lg">Get directions</Link>
          </div>
        </div>
      </section>

      <section className="section container">
        <Faq />
      </section>
    </div>
  );
}
