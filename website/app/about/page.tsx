import type { Metadata } from "next";
import Image from "next/image";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import Icon from "@/components/Icon";
import JsonLd from "@/components/JsonLd";
import { getSiteContent, contentImage } from "@/lib/site-content";

export const metadata: Metadata = pageMetadata({
  title: "About — Aqua Lagoon",
  description:
    "Aqua Lagoon is the friendliest, safest place in town to learn, swim, move and celebrate — for kids and grown-ups alike.",
  path: "/about",
});

export default async function AboutPage() {
  const { about } = await getSiteContent();

  return (
    <div className="route-enter">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <div className="page-hero bg-radial-right">
        <div className="container">
          <span className="eyebrow">Our story</span>
          <h1>{about.title}</h1>
          <p style={{ maxWidth: 640 }}>{about.intro}</p>
        </div>
      </div>

      <section className="about-split">
        <div>
          <h2>{about.storyTitle}</h2>
          {about.storyParagraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className="about-tile">
          {contentImage(about.imageUrl) ? (
            <Image
              src={contentImage(about.imageUrl)}
              alt="Our facility"
              fill
              sizes="(max-width: 960px) 100vw, 480px"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span className="placeholder-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0c3b63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" /><circle cx="12" cy="13" r="3" /></svg>
              our facility
            </span>
          )}
        </div>
      </section>

      {about.highlights.length > 0 && (
        <section className="safety-wrap" style={{ paddingBottom: 20 }}>
          <h2>{about.highlightsTitle}</h2>
          <div className="grid-3">
            {about.highlights.map((h) => (
              <div key={h.title} className="safety-card">
                <div className="ic" style={{ background: h.tint }}>
                  <Icon name={h.icon} color={h.color} size={26} />
                </div>
                <h3>{h.title}</h3>
                <p>{h.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {about.stats.length > 0 && (
        <section className="about-numbers">
          <div className="inner">
            <h2>By the numbers</h2>
            <div className="grid-4">
              {about.stats.map((s) => (
                <div key={`${s.label}-${s.value}`} className="stat-card">
                  <div className="v">{s.value}</div>
                  <div className="l">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {about.classInfo.length > 0 && (
        <section className="safety-wrap" style={{ paddingBottom: 20 }}>
          <h2>{about.classInfoTitle}</h2>
          <div className="spec-grid">
            {about.classInfo.map((c) => (
              <div key={c.label} className="spec-item">
                <div className="k">{c.label}</div>
                <div className="v">{c.value}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {about.safety.length > 0 && (
        <section className="safety-wrap">
          <h2>Safety first, always</h2>
          <div className="grid-3">
            {about.safety.map((s) => (
              <div key={s.title} className="safety-card">
                <div className="ic" style={{ background: s.tint }}>
                  <Icon name={s.icon} color={s.color} size={26} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
