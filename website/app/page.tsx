import Image from "next/image";
import Link from "next/link";
import Icon, { IconTile } from "@/components/Icon";
import Timetable from "@/components/Timetable";
import Testimonials from "@/components/Testimonials";
import Faq from "@/components/Faq";
import ServiceSlider from "@/components/ServiceSlider";
import Social from "@/components/Social";
import { AUDIENCES, WHYFIT, WHYUS } from "@/lib/data";
import { BRAND } from "@/lib/constants";
import { getSiteContent, contentImage } from "@/lib/site-content";

export default async function HomePage() {
  const { homepage, services, timetable, contact } = await getSiteContent();
  const heroSrc = contentImage(homepage.heroImageUrl);
  const offerCards = services.map((sv) => ({
    id: sv.id,
    title: sv.title,
    icon: sv.icon,
    color: sv.color,
    tint: sv.tint,
    img: contentImage(sv.imageUrl),
  }));

  return (
    <div className="route-enter">
      {/* HERO */}
      <section className="hero-wrap" aria-label="Welcome">
        <div className="hero">
          <Image
            className="hero-photo"
            src={heroSrc}
            alt="A swimmer at Aqua Lagoon"
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
          />
          <div className="hero-overlay" />
          <div className="hero-body">
            <div>
              <div className="hero-title-wrap">
                <h1 className="hero-title">{BRAND.name}</h1>
                <span className="hero-title is-wave" aria-hidden="true">{BRAND.name}</span>
              </div>
              <div className="hero-lead">
                <div className="kicker">{homepage.heroKicker}</div>
                <p>{homepage.heroLead}</p>
              </div>
            </div>
            <div className="hero-foot">
              <div className="hero-stats">
                {homepage.stats.map((s) => (
                  <div className="hero-stat" key={`${s.label}-${s.value}`}>
                    <div className="val">{s.value}</div>
                    <div className="lbl">{s.label}</div>
                  </div>
                ))}
              </div>
              <Social social={contact.social} wrapperClass="hero-social" />
            </div>
          </div>
        </div>

        {/* sub strip */}
        <div className="substrip">
          <div className="substrip-cell">
            <div className="substrip-avatar">
              <Image src={heroSrc} alt="Swimmer" width={88} height={88} />
              <Link href="/services" className="go-btn" aria-label="Explore services">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>
              </Link>
            </div>
            <p className="p1">Teaching swimmers of every age — blending safety, skill, and the pure joy of water.</p>
          </div>
          <div className="substrip-divider" />
          <div className="substrip-cell">
            <svg width="54" height="34" viewBox="0 0 54 34" fill="none" stroke="#0c3b63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><path d="M6 3v28" /><path d="M48 3v28" /><path d="M13 17h28" /><path d="M13 17l7-7" /><path d="M13 17l7 7" /><path d="M41 17l-7-7" /><path d="M41 17l-7 7" /></svg>
            <p className="p2">Guided by certified coaches. Built for confidence. Creating serene spaces made for wellness and play.</p>
          </div>
        </div>
      </section>

      {/* WHAT WE OFFER — slider */}
      <section className="offer-section">
        {/* Wordmark drawn via ::before so a11y tooling ignores the decorative text */}
        <div className="offer-wordmark" aria-hidden="true" data-text={BRAND.name} />
        <div className="offer-inner">
          <div className="offer-head">
            <span className="eyebrow">What we offer</span>
            <h2>Everything for water &amp; wellness</h2>
            <p>
              A safe, sparkling home for swimming lessons, open swims and family fun — plus yoga, zumba and a mini
              auditorium for your events, all under one roof.
            </p>
            <div className="offer-cta">
              <Link href="/contact?intent=book" className="btn btn-primary">Book Now</Link>
              <Link href="/contact" className="btn btn-ghost">Contact Us</Link>
            </div>
          </div>
          <ServiceSlider cards={offerCards} />
        </div>
      </section>

      {/* FOR EVERYONE */}
      <section className="container" style={{ padding: "64px 22px 0" }}>
        <div className="everyone">
          <div className="section-head" style={{ maxWidth: 580, marginBottom: 32 }}>
            <span className="eyebrow">For every age</span>
            <h2 style={{ fontSize: 36 }}>Something for everyone</h2>
            <p>From first-time floaters to fitness regulars and event hosts — Aqua Lagoon fits your day.</p>
          </div>
          <div className="grid-4">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="audience-card">
                <IconTile name={a.icon} color={a.color} tint={a.tint} size={26} />
                <div className="title">{a.title}</div>
                <p>{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY WE'RE THE RIGHT FIT */}
      <section className="section container" style={{ paddingBottom: 10 }}>
        <div className="section-head">
          <span className="eyebrow">Why Aqua Lagoon</span>
          <h2>Where passion meets precision</h2>
          <p>Why we&apos;re the right fit for your swim journey.</p>
        </div>
        <div className="whyfit">
          {WHYFIT.map((w) => (
            <div key={w.title} className="whyfit-card">
              <div className="art">
                <Image src={w.img} alt={w.title} width={132} height={132} />
              </div>
              <h3>{w.title}</h3>
              <p>{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <Testimonials />

      {/* WHY US */}
      <section className="whyus" aria-label="Why us">
        <div className="inner">
          <div className="pool-tile">
            {contentImage(homepage.whyUsImageUrl) ? (
              <Image
                src={contentImage(homepage.whyUsImageUrl)}
                alt="Our pool"
                fill
                sizes="(max-width: 960px) 100vw, 520px"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <span className="badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0c3b63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" /><circle cx="12" cy="13" r="3" /></svg>
                clean, lifeguarded pool
              </span>
            )}
          </div>
          <div>
            <span className="eyebrow">Why Aqua Lagoon</span>
            <h2>A safe splash for every age</h2>
            <div className="whyus-list">
              {WHYUS.map((w) => (
                <div key={w.title} className="whyus-item">
                  <div className="ic" style={{ background: w.tint }}>
                    <Icon name={w.icon} color={w.color} size={22} />
                  </div>
                  <div>
                    <div className="t">{w.title}</div>
                    <div className="d">{w.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TIMETABLE PREVIEW */}
      <section className="section container">
        <div className="timetable-head">
          <div>
            <span className="eyebrow">Plan your visit</span>
            <h2>This week&apos;s timetable</h2>
          </div>
          <Link href="/classes" className="btn btn-soft">Full schedule &amp; pricing →</Link>
        </div>
        <Timetable timetable={timetable} />
      </section>

      {/* FAQ — local Q&A content (helps search + AI answer engines) */}
      <section className="section container">
        <Faq />
      </section>

      {/* CTA */}
      <section className="section container">
        <div className="cta-band">
          <div className="wave">
            <svg viewBox="0 0 2880 120" preserveAspectRatio="none"><path d="M0,60 C240,110 480,110 720,60 C960,10 1200,10 1440,60 C1680,110 1920,110 2160,60 C2400,10 2640,10 2880,60 L2880,120 L0,120 Z" fill="#ffffff" /></svg>
          </div>
          <h2>Ready to make a splash?</h2>
          <p>Book a free trial swim session or reserve the auditorium for your next celebration.</p>
          <div className="actions">
            <Link href="/contact?intent=book" className="btn btn-white btn-lg">Book Now</Link>
            <Link href="/contact" className="btn btn-outline-white btn-lg">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
