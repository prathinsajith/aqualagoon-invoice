import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { getSiteContent, contentImage } from "@/lib/site-content";

export async function generateStaticParams() {
  const { services } = await getSiteContent();
  return services.map((s) => ({ slug: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { services } = await getSiteContent();
  const sv = services.find((s) => s.id === slug);
  if (!sv) return { title: "Service — Aqua Lagoon" };
  return {
    title: `${sv.title} — Aqua Lagoon`,
    description: sv.blurb || sv.long.slice(0, 160),
    alternates: { canonical: `/services/${sv.id}` },
    openGraph: {
      title: `${sv.title} — Aqua Lagoon`,
      description: sv.blurb || sv.long.slice(0, 160),
      images: sv.imageUrl ? [contentImage(sv.imageUrl)] : undefined,
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { services } = await getSiteContent();
  const sv = services.find((s) => s.id === slug);
  if (!sv) notFound();

  const img = contentImage(sv.imageUrl);
  const others = services.filter((s) => s.id !== sv.id);

  return (
    <div className="route-enter">
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
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={sv.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
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
