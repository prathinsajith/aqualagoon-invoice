import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import JsonLd from "@/components/JsonLd";
import { getSiteContent, contentImage } from "@/lib/site-content";
import { pageMetadata, serviceJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export async function generateStaticParams() {
  const { services } = await getSiteContent();
  return services.map((s) => ({ slug: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const [{ slug }, { services }] = await Promise.all([params, getSiteContent()]);
  const sv = services.find((s) => s.id === slug);
  if (!sv) return { title: "Service — Aqua Lagoon" };
  // Bundled defaults have a 1200×630 JPEG share version (WhatsApp's scraper
  // doesn't reliably render WebP); admin-uploaded images pass through as-is.
  const shareImage = sv.imageUrl?.startsWith("/assets/svc-")
    ? sv.imageUrl.replace("/assets/svc-", "/assets/og/svc-").replace(/\.webp$/, ".jpg")
    : sv.imageUrl
      ? contentImage(sv.imageUrl)
      : undefined;
  return pageMetadata({
    title: `${sv.title} — Aqua Lagoon`,
    description: sv.blurb || sv.long.slice(0, 160),
    path: `/services/${sv.id}`,
    image: shareImage,
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, { services }] = await Promise.all([params, getSiteContent()]);
  const sv = services.find((s) => s.id === slug);
  if (!sv) notFound();

  const img = contentImage(sv.imageUrl);
  const others = services.filter((s) => s.id !== sv.id);

  return (
    <div className="route-enter">
      <JsonLd data={serviceJsonLd({ id: sv.id, title: sv.title, description: sv.blurb || sv.long.slice(0, 200) })} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: sv.title, path: `/services/${sv.id}` },
        ])}
      />
      <div className="page-hero bg-radial-right">
        <div className="container">
          <Link href="/services" className="eyebrow" style={{ display: "inline-block", marginBottom: 4 }}>
            ← All services
          </Link>
          <h1>{sv.title}</h1>
          <p>{sv.blurb}</p>
        </div>
      </div>

      <section className="services-list" style={{ paddingBottom: 10 }}>
        <div className="service-row img-left">
          <div className="service-media" style={{ background: sv.tint }}>
            {img ? (
              <Image src={img} alt={sv.title} fill sizes="(max-width: 960px) 100vw, 560px" style={{ objectFit: "cover" }} />
            ) : (
              <div>
                <Icon name={sv.icon} color={sv.color} size={96} />
              </div>
            )}
          </div>
          <div className="service-body">
            <h2>{sv.title}</h2>
            <p>{sv.long}</p>
            <div className="tags">
              {sv.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <Link href="/contact?intent=book" className="btn btn-primary btn-lg">
              {sv.cta}
            </Link>
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="section container" style={{ paddingTop: 20 }}>
          <div className="section-head" style={{ marginBottom: 24 }}>
            <span className="eyebrow">More at Aqua Lagoon</span>
            <h2 style={{ fontSize: 30 }}>Explore other programs</h2>
          </div>
          <div className="grid-3">
            {others.map((o) => (
              <Link key={o.id} href={`/services/${o.id}`} className="service-card">
                <div className="icon-tile" style={{ background: o.tint }}>
                  <Icon name={o.icon} color={o.color} size={30} />
                </div>
                <h3>{o.title}</h3>
                <p>{o.blurb}</p>
                <span className="more">Learn more →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
