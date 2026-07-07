"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EVENT_TYPE_OPTIONS, GUEST_OPTIONS } from "@/lib/data";

const bookingSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120, "Name is too long"),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number")
    .max(60, "Phone number is too long")
    .regex(/^[+\d][\d\s()-]*$/, "Enter a valid phone number"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(160, "Email is too long")
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email address"),
  eventType: z.string().min(1),
  guests: z.string().min(1),
});
type BookingValues = z.infer<typeof bookingSchema>;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** midnight of a date, for day-level comparisons */
function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BookingCalendar() {
  // Dates are computed only after mount to avoid SSR/client hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  const [view, setView] = useState<{ y: number; m: number } | null>(null);
  const [selected, setSelected] = useState<Date | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = atMidnight(new Date());
    setToday(now);
    setView({ y: now.getFullYear(), m: now.getMonth() });
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    mode: "onTouched",
    defaultValues: { name: "", phone: "", email: "", eventType: EVENT_TYPE_OPTIONS[0], guests: GUEST_OPTIONS[0] },
  });

  const cells = useMemo(() => {
    if (!view) return [];
    const first = new Date(view.y, view.m, 1);
    const lead = first.getDay(); // blanks before day 1
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const out: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(view.y, view.m, d));
    return out;
  }, [view]);

  function shiftMonth(delta: number) {
    setView((v) => (v ? { y: v.m + delta < 0 ? v.y - 1 : v.m + delta > 11 ? v.y + 1 : v.y, m: (v.m + delta + 12) % 12 } : v));
  }

  const canGoPrev = useMemo(() => {
    if (!view || !today) return false;
    // Don't allow navigating to a month entirely in the past.
    return view.y > today.getFullYear() || (view.y === today.getFullYear() && view.m > today.getMonth());
  }, [view, today]);

  async function onSubmit(values: BookingValues) {
    if (!selected) return;
    setError(null);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          eventDate: ymd(selected),
          source: "booking",
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      reset();
      setSelected(null);
    } catch {
      setError("Something went wrong. Please try again or call us directly.");
    }
  }

  if (submitted) {
    return (
      <div className="booking-wrap booking-success">
        <div className="check">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3>Booking request received</h3>
        <p>We&apos;ve got your request and will call you back shortly to confirm the details.</p>
        <button type="button" className="btn btn-soft" onClick={() => setSubmitted(false)}>
          Book another date →
        </button>
      </div>
    );
  }

  return (
    <div className="booking-wrap">
      {/* Calendar */}
      <div className="booking-cal">
        <div className="booking-cal-head">
          <div className="booking-month">
            {mounted && view ? `${MONTHS[view.m]} ${view.y}` : " "}
          </div>
          <div className="booking-nav">
            <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)} disabled={!canGoPrev}>
              ‹
            </button>
            <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)}>
              ›
            </button>
          </div>
        </div>
        <div className="booking-grid booking-dow">
          {WEEKDAYS.map((d) => (
            <span key={d} className="dow">{d}</span>
          ))}
        </div>
        <div className="booking-grid">
          {mounted &&
            cells.map((d, i) => {
              if (!d) return <span key={`b${i}`} className="booking-day is-empty" />;
              const isPast = today ? d < today : false;
              const isSelected = selected ? d.getTime() === selected.getTime() : false;
              return (
                <button
                  key={ymd(d)}
                  type="button"
                  className={`booking-day${isSelected ? " is-selected" : ""}`}
                  disabled={isPast}
                  aria-pressed={isSelected}
                  onClick={() => setSelected(d)}
                >
                  {d.getDate()}
                </button>
              );
            })}
        </div>
        <div className="booking-legend">
          <span><i className="dot dot-available" /> Available</span>
          <span><i className="dot dot-selected" /> Selected</span>
        </div>
      </div>

      {/* Form */}
      <form className="booking-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h3>Secure your date</h3>
        <p className="booking-sel">
          {selected ? `Selected: ${ymd(selected)}` : "Please select an available date from the calendar first."}
        </p>
        <div className="field-row">
          <div className="field">
            <label htmlFor="bk-name">Full name</label>
            <input id="bk-name" type="text" placeholder="Your name" aria-invalid={!!errors.name} {...register("name")} />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>
          <div className="field">
            <label htmlFor="bk-phone">Phone</label>
            <input id="bk-phone" type="tel" inputMode="tel" placeholder="Mobile number" aria-invalid={!!errors.phone} {...register("phone")} />
            {errors.phone && <p className="field-error">{errors.phone.message}</p>}
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="bk-email">Email address</label>
            <input id="bk-email" type="email" placeholder="you@email.com" aria-invalid={!!errors.email} {...register("email")} />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>
          <div className="field">
            <label htmlFor="bk-type">Event type</label>
            <select id="bk-type" {...register("eventType")}>
              {EVENT_TYPE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="bk-guests">Estimated guests</label>
          <select id="bk-guests" {...register("guests")}>
            {GUEST_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        {error && <p className="field-error form-error">{error}</p>}
        <button className="form-submit" type="submit" disabled={!selected || isSubmitting}>
          {isSubmitting ? "Sending…" : "Request Booking →"}
        </button>
      </form>
    </div>
  );
}
