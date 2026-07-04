import type { Metadata } from "next";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import Icon from "@/components/Icon";
import ContactForm from "@/components/ContactForm";
import JsonLd from "@/components/JsonLd";
import { getSiteContent } from "@/lib/site-content";
import { MAPS } from "@/lib/constants";

export const metadata: Metadata = pageMetadata({
  title: "Contact — Swimming Pool in Kayamkulam | Aqua Lagoon",
  description:
    "Visit or book Aqua Lagoon swimming pool in Kayamkulam, Kerala. Serving Kayamkulam, Mavelikkara, Alappuzha & Oachira — get directions, call or send an enquiry.",
  path: "/contact",
});

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const { intent } = await searchParams;
  const source = intent === "book" ? "booking" : "contact";
  const { contact } = await getSiteContent();

  const info = [
    { icon: "pin", color: "#1479cf", tint: "#e0f4fd", title: "Visit us", value: contact.address },
    { icon: "phone", color: "#2b6fd4", tint: "#e6f0fe", title: "Call / WhatsApp", value: contact.phone },
    { icon: "mail", color: "#0e9e8a", tint: "#e0f7f4", title: "Email", value: contact.email },
    {
      icon: "clock",
      color: "#d08512",
      tint: "#fff4e2",
      title: "Open hours",
      value: `${contact.hoursWeekday} · ${contact.hoursSunday}`,
    },
  ];

  return (
    <div className="route-enter">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
      <div className="page-hero bg-radial-left">
        <div className="container">
          <span className="eyebrow">Get in touch</span>
          <h1>Contact &amp; Booking</h1>
          <p>Questions, bookings or a facility tour — we&apos;d love to hear from you.</p>
        </div>
      </div>

      <section className="contact-grid">
        <div className="contact-info">
          {info.map((c) => (
            <div key={c.title} className="info-card">
              <div className="ic" style={{ background: c.tint }}>
                <Icon name={c.icon} color={c.color} size={23} />
              </div>
              <div>
                <div className="t">{c.title}</div>
                <div className="v">{c.value}</div>
              </div>
            </div>
          ))}
          <div className="map-tile" style={{ height: 240, padding: 0, background: "none" }}>
            <iframe
              src={MAPS.embedUrl}
              title="Aqua Lagoon location on Google Maps"
              style={{ width: "100%", height: "100%", border: 0, display: "block" }}
              loading="lazy"
              sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <a href={MAPS.link} target="_blank" rel="noopener noreferrer" className="btn btn-soft" style={{ alignSelf: "flex-start" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>
            Get directions →
          </a>
        </div>
        <ContactForm source={source} />
      </section>
    </div>
  );
}
