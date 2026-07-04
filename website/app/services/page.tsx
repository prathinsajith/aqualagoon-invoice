import type { Metadata } from "next";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import JsonLd from "@/components/JsonLd";
import { getSiteContent, contentImage } from "@/lib/site-content";

export const metadata: Metadata = pageMetadata({
  title: "Services & Programs — Aqua Lagoon",
  description:
    "Open swimming, learn-to-swim lessons, yoga, zumba and a mini auditorium — explore everything Aqua Lagoon offers.",
  path: "/services",
});

export default async function ServicesPage() {
  const { services } = await getSiteContent();

  return (
    <div className="route-enter">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }])} />
      <div className="page-hero bg-radial-right">
        <div className="container">
          <span className="eyebrow">Our facilities</span>
          <h1>Services &amp; Programs</h1>
          <p>From your first float to fitness and functions — explore everything Aqua Lagoon has to offer.</p>
        </div>
      </div>

      <section className="services-list">
        {services.map((sv) => {
          const img = contentImage(sv.imageUrl);
          return (
            <div key={sv.id} className={`service-row ${sv.imgRight ? "img-right" : "img-left"}`}>
              <Link href={`/services/${sv.id}`} className="service-media" style={{ background: sv.tint, textDecoration: "none" }}>
                {img ? (
                  <Image src={img} alt={sv.title} fill sizes="(max-width: 960px) 100vw, 560px" style={{ objectFit: "cover" }} />
                ) : (
                  <div>
                    <Icon name={sv.icon} color={sv.color} size={76} />
                  </div>
                )}
              </Link>
              <div className="service-body">
                <h2>{sv.title}</h2>
                <p>{sv.long}</p>
                <div className="tags">
                  {sv.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <Link href="/contact?intent=book" className="btn btn-primary">
                    {sv.cta}
                  </Link>
                  <Link href={`/services/${sv.id}`} className="btn btn-soft">
                    Learn more →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <div className="help-band">
        <div className="box">
          <h2>Not sure which program fits?</h2>
          <p>Our team will help you pick the right session for your family.</p>
          <Link href="/contact" className="btn btn-ghost">Talk to us →</Link>
        </div>
      </div>
    </div>
  );
}
