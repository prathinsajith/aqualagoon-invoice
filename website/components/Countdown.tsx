"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Live countdown to `target` (ISO string). Renders "--" until mounted so the
 * server and client first paint agree (Date.now() would mismatch on hydration).
 */
export default function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  let parts: { value: string; label: string }[];
  if (now === null) {
    parts = [
      { value: "--", label: "Days" },
      { value: "--", label: "Hours" },
      { value: "--", label: "Minutes" },
      { value: "--", label: "Seconds" },
    ];
  } else {
    let diff = Math.max(0, new Date(target).getTime() - now);
    const DAY = 86_400_000, HR = 3_600_000, MIN = 60_000;
    const d = Math.floor(diff / DAY);
    diff -= d * DAY;
    const h = Math.floor(diff / HR);
    diff -= h * HR;
    const m = Math.floor(diff / MIN);
    diff -= m * MIN;
    const s = Math.floor(diff / 1000);
    parts = [
      { value: String(d), label: "Days" },
      { value: pad(h), label: "Hours" },
      { value: pad(m), label: "Minutes" },
      { value: pad(s), label: "Seconds" },
    ];
  }

  return (
    <div className="cs-count" role="timer" aria-label="Time until launch">
      {parts.map((p) => (
        <div key={p.label} className="cs-cell">
          <div className="v">{p.value}</div>
          <div className="l">{p.label}</div>
        </div>
      ))}
    </div>
  );
}
