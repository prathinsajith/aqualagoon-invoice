"use client";

import { useState } from "react";
import { FAQS } from "@/lib/data";

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="faq">
      <h2>Frequently asked</h2>
      <div className="faq-list">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className={`faq-item${isOpen ? " is-open" : ""}`}>
              <button
                className="faq-q"
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                {f.q}
                <span className="sign">+</span>
              </button>
              <div className="faq-a">{f.a}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
