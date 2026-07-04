import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import Icon from "@/components/Icon";
import Timetable from "@/components/Timetable";
import Faq from "@/components/Faq";
import { getSiteContent } from "@/lib/site-content";

export const metadata: Metadata = pageMetadata({
  title: "Classes & Pricing — Aqua Lagoon",
  description:
    "Weekly timetable and simple, transparent pricing for swimming, yoga and zumba. Free trial for first-time swimmers.",
  path: "/classes",
});

export default async function ClassesPage() {
  const { timetable, pricing } = await getSiteContent();
  return (
    <div className="route-enter">
      <div className="page-hero bg-radial-left">
        <div className="container">
          <span className="eyebrow">Schedule &amp; rates</span>
          <h1>Classes &amp; Pricing</h1>
          <p>Weekly timetable and simple, transparent pricing. Free trial for first-time swimmers.</p>
        </div>
      </div>

      <section className="container" style={{ padding: "52px 22px 10px" }}>
        <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 30, color: "var(--navy)", margin: "0 0 20px" }}>
          Weekly timetable
        </h2>
        <Timetable timetable={timetable} />
      </section>

      <section className="container" style={{ padding: "56px 22px 20px" }}>
        <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 30, color: "var(--navy)", margin: "0 0 22px" }}>
          Membership &amp; passes
        </h2>
        <div className="pricing-grid">
          {pricing.plans.map((p) => (
            <div key={p.id} className={`price-card${p.popular ? " featured" : ""}`}>
              {p.popular && <span className="badge-pop">★ Most popular</span>}
              <div className="name">{p.name}</div>
              <div className="price-row">
                <span className="price">{p.price}</span>
                <span className="unit">{p.unit}</span>
              </div>
              <div className="rule" />
              <div className="features">
                {p.features.map((f) => (
                  <div className="feat" key={f}>
                    <Icon name="check" color={p.popular ? "#6fd6f5" : "#2bc0e8"} size={16} sw={3} />
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/contact?intent=book" className="buy" style={{ display: "block", textAlign: "center" }}>
                {p.btn}
              </Link>
            </div>
          ))}
        </div>
        {pricing.note && <p className="price-note">{pricing.note}</p>}
      </section>

      <Faq />
    </div>
  );
}
