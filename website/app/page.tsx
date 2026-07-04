import Link from "next/link";
import Icon, { IconTile } from "@/components/Icon";
import Timetable from "@/components/Timetable";
import Testimonials from "@/components/Testimonials";
import { AUDIENCES, WHYFIT, WHYUS } from "@/lib/data";
import { BRAND } from "@/lib/constants";
import { getSiteContent, contentImage } from "@/lib/site-content";

export default async function HomePage() {
  const { homepage, services, timetable } = await getSiteContent();
  const heroSrc = contentImage(homepage.heroImageUrl);

  return (
    <div className="route-enter">
      {/* HERO */}
      <section className="hero-wrap" aria-label="Welcome">
        <div className="hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-photo" src={heroSrc} alt="A swimmer at Aqua Lagoon" />
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
                {homepage.stats.map((s, i) => (
                  <div className="hero-stat" key={i}>
                    <div className="val">{s.value}</div>
                    <div className="lbl">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="hero-social">
                <a href="#" aria-label="Facebook"><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg></a>
                <a href="#" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none" /></svg></a>
                <a href="#" aria-label="X"><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-7-6.2 7H1.4l8.1-9.3L1 2h7l4.9 6.4L18.9 2z" /></svg></a>
              </div>
            </div>
          </div>
        </div>

        {/* sub strip */}
        <div className="substrip">
          <div className="substrip-cell">
            <div className="substrip-avatar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroSrc} alt="Swimmer" />
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

      {/* SERVICES STRIP */}
      <section className="section container">
        <div className="section-head" style={{ maxWidth: 640 }}>
          <span className="eyebrow">What we offer</span>
          <h2>Everything for water &amp; wellness</h2>
        </div>
        <div className="grid-3">
          {services.map((sv) => (
            <Link key={sv.id} href="/services" className="service-card">
              <IconTile name={sv.icon} color={sv.color} tint={sv.tint} size={30} />
              <h3>{sv.title}</h3>
              <p>{sv.blurb}</p>
              <span className="more">Learn more →</span>
            </Link>
          ))}
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.img} alt={w.title} loading="lazy" />
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
              // eslint-disable-next-line @next/next/no-img-element
              <img src={contentImage(homepage.whyUsImageUrl)} alt="Our pool" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
