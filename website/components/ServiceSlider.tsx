"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";

export type OfferCard = {
  id: string;
  title: string;
  icon: string;
  color: string;
  tint: string;
  img: string;
};

const AUTO_MS = 3500;

/**
 * Auto-rotating slider of tall photo cards (What we offer). Cards alternate a
 * subtle tilt that straightens on hover; the track scroll-snaps and the active
 * card drives the dots. Auto-advances, loops, and pauses on hover.
 */
export default function ServiceSlider({ cards }: { cards: OfferCard[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Mirror of `active` for the interval callback — avoids side effects inside
  // a setState updater (StrictMode double-invokes those in dev).
  const activeRef = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const goSlide = useCallback((i: number) => {
    activeRef.current = i;
    setActive(i);
    const el = trackRef.current;
    if (!el) return;
    const child = el.children[i] as HTMLElement | undefined;
    if (!child) return;
    el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2, behavior: "smooth" });
  }, []);

  const nudge = useCallback(
    (dir: number) => {
      const max = cards.length - 1;
      let n = activeRef.current + dir;
      if (n < 0) n = max;
      if (n > max) n = 0;
      goSlide(n);
    },
    [cards.length, goSlide],
  );

  const stopAuto = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const startAuto = useCallback(() => {
    stopAuto();
    timer.current = setInterval(() => nudge(1), AUTO_MS);
  }, [nudge, stopAuto]);

  useEffect(() => {
    startAuto();
    return stopAuto;
  }, [startAuto, stopAuto]);

  // Keep the dots in sync when the user scrolls/swipes the track directly.
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const c = el.children[i] as HTMLElement;
      const cc = c.offsetLeft + c.clientWidth / 2;
      const d = Math.abs(cc - center);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    activeRef.current = best;
    setActive((cur) => (best !== cur ? best : cur));
  };

  const arrow = (dir: number) => {
    stopAuto();
    nudge(dir);
    startAuto();
  };

  return (
    <div className="offer-slider" onMouseEnter={stopAuto} onMouseLeave={startAuto}>
      <div className="offer-track" ref={trackRef} onScroll={onScroll} data-al-slidertrack>
        {cards.map((sv) => (
          <div key={sv.id} className="offer-slide">
            <Link href={`/services/${sv.id}`} className="offer-card" style={{ background: sv.tint }}>
              {sv.img ? (
                <Image
                  className="offer-photo"
                  src={sv.img}
                  alt={sv.title}
                  fill
                  sizes="(max-width: 960px) 80vw, 332px"
                />
              ) : (
                <span className="offer-photo offer-photo-fallback">
                  <Icon name={sv.icon} color={sv.color} size={76} />
                </span>
              )}
              <span className="offer-card-shade" aria-hidden="true" />
              <span className="offer-chip">
                <Icon name={sv.icon} color={sv.color} size={26} />
              </span>
            </Link>
            <Link href={`/services/${sv.id}`} className="offer-label">
              {sv.title}
            </Link>
          </div>
        ))}
      </div>

      <button type="button" className="offer-arrow prev" aria-label="Previous" onClick={() => arrow(-1)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <button type="button" className="offer-arrow next" aria-label="Next" onClick={() => arrow(1)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      </button>

      <div className="offer-dots">
        {cards.map((sv, i) => (
          <button
            key={sv.id}
            type="button"
            className={`offer-dot${i === active ? " is-active" : ""}`}
            aria-label={`Go to ${sv.title}`}
            aria-current={i === active}
            onClick={() => {
              stopAuto();
              goSlide(i);
              startAuto();
            }}
          />
        ))}
      </div>
    </div>
  );
}
