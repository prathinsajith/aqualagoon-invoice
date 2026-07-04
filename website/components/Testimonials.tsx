"use client";

import { useEffect, useState } from "react";
import { TESTIMONIALS } from "@/lib/data";

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  // Auto-rotate every 6s; resets whenever the user picks a dot.
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(id);
  }, [index]);

  const t = TESTIMONIALS[index];

  return (
    <section className="testimonials" aria-label="Testimonials">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="inner">
        <span className="eyebrow">Happy families</span>
        <h2>Loved by our members</h2>
        <div className="quote-card">
          <div className="quote">“{t.quote}”</div>
          <div className="name">{t.name}</div>
          <div className="role">{t.role}</div>
        </div>
        <div className="dots">
          {TESTIMONIALS.map((item, i) => (
            <button
              key={item.name}
              type="button"
              aria-label={`Show testimonial ${i + 1}`}
              className={i === index ? "is-active" : ""}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
