"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SERVICE_OPTIONS } from "@/lib/data";
import { enquiryFormSchema, type EnquiryFormValues } from "@/lib/enquiry-schema";

export default function ContactForm({ source = "contact" }: { source?: "contact" | "booking" }) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquiryFormSchema),
    mode: "onTouched", // validate a field once the user leaves it, then live
    defaultValues: { name: "", phone: "", email: "", service: SERVICE_OPTIONS[0], message: "" },
  });

  async function onSubmit(values: EnquiryFormValues) {
    setError(null);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, source }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      reset();
    } catch {
      setError("Something went wrong. Please try again or call us directly.");
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
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <h2>Book or enquire</h2>
        <p className="sub">We&apos;ll get back within a day.</p>
        <div className="field">
          <label htmlFor="cf-name">Full name</label>
          <input
            id="cf-name"
            type="text"
            placeholder="Your name"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="cf-phone">Phone</label>
            <input
              id="cf-phone"
              type="tel"
              inputMode="tel"
              placeholder="Mobile number"
              aria-invalid={!!errors.phone}
              {...register("phone")}
            />
            {errors.phone && <p className="field-error">{errors.phone.message}</p>}
          </div>
          <div className="field">
            <label htmlFor="cf-email">
              Email <span className="opt">(optional)</span>
            </label>
            <input
              id="cf-email"
              type="email"
              placeholder="you@email.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>
        </div>
        <div className="field">
          <label htmlFor="cf-service">Interested in</label>
          <select id="cf-service" {...register("service")}>
            {SERVICE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="cf-message">Message</label>
          <textarea
            id="cf-message"
            rows={3}
            placeholder="Tell us what you need…"
            aria-invalid={!!errors.message}
            {...register("message")}
          />
          {errors.message && <p className="field-error">{errors.message.message}</p>}
        </div>
        {error && <p className="field-error form-error">{error}</p>}
        <button className="form-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send request →"}
        </button>
      </form>
    </div>
  );
}
