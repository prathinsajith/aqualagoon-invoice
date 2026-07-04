import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { AREAS } from "@/lib/areas";
import { LOCATION } from "@/lib/constants";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Areas We Serve — Swimming Pool near Kayamkulam | Aqua Lagoon",
  description: `Aqua Lagoon swimming pool in ${LOCATION.locality}, Kerala serves ${LOCATION.areasServed.join(", ")}. Swimming lessons, open swims, yoga and zumba for the whole region.`,
  path: "/areas",
});

export default function AreasPage() {
  return (
    <div className="route-enter">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Areas we serve", path: "/areas" }])} />

      <div className="page-hero center bg-radial-center">
        <div className="container">
          <span className="eyebrow">Areas we serve</span>
          <h1>A swimming pool for the whole region</h1>
          <p style={{ maxWidth: 640, margin: "14px auto 0" }}>
            Based in {LOCATION.locality}, Kerala, Aqua Lagoon welcomes swimmers from across the surrounding towns.
            Find your area below.
          </p>
        </div>
      </div>

      <section className="section container">
        <div className="grid-3">
          {/* Home town links to the homepage, which already targets it */}
          <Link href="/" className="service-card">
            <h3>Swimming Pool in {LOCATION.locality}</h3>
            <p>Our home — lessons, open swims, yoga, zumba and events at the main centre.</p>
            <span className="more">Visit home →</span>
          </Link>
          {AREAS.map((a) => (
            <Link key={a.slug} href={`/areas/${a.slug}`} className="service-card">
              <h3>Swimming Pool in {a.name}</h3>
              <p>{a.blurb}</p>
              <span className="more">See {a.name} →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
