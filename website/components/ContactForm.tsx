"use client";

import { useState } from "react";
import { SERVICE_OPTIONS } from "@/lib/data";

export default function ContactForm({ source = "contact" }: { source?: "contact" | "booking" }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      service: String(fd.get("service") || "").trim(),
      message: String(fd.get("message") || "").trim(),
      source,
    };

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      form.reset();
    } catch {
      setError("Something went wrong. Please try again or call us directly.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="contact-form">
        <div className="form-success">
          <div className="check">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2>Thank you!</h2>
          <p>We&apos;ve received your request and will call you back shortly.</p>
          <button className="btn btn-soft" type="button" onClick={() => setSubmitted(false)}>
            Send another →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-form">
      <form onSubmit={handleSubmit} noValidate>
        <h2>Book or enquire</h2>
        <p className="sub">We&apos;ll get back within a day.</p>
        <div className="field">
          <label htmlFor="cf-name">Full name</label>
          <input id="cf-name" name="name" type="text" placeholder="Your name" required />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="cf-phone">Phone</label>
            <input id="cf-phone" name="phone" type="tel" placeholder="Mobile number" required />
          </div>
          <div className="field">
            <label htmlFor="cf-email">Email</label>
            <input id="cf-email" name="email" type="email" placeholder="you@email.com" required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="cf-service">Interested in</label>
          <select id="cf-service" name="service" defaultValue={SERVICE_OPTIONS[0]}>
            {SERVICE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="cf-message">Message</label>
          <textarea id="cf-message" name="message" rows={3} placeholder="Tell us what you need…" />
        </div>
        {error && (
          <p style={{ color: "#dc2626", fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>{error}</p>
        )}
        <button className="form-submit" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send request →"}
        </button>
      </form>
    </div>
  );
}
