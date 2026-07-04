import type { CSSProperties } from "react";

/** A shape is a path `d` string, a circle `{c:[cx,cy,r]}`, or a rect `{r:[x,y,w,h,rx]}`. */
type Shape =
  | string
  | { c: [number, number, number] }
  | { r: [number, number, number, number, number] };

const ICONS: Record<string, Shape[]> = {
  waves: ["M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1", "M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1", "M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1"],
  gradcap: ["M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z", "M22 10v6", "M6 12.5V16a6 3 0 0 0 12 0v-3.5"],
  droplets: ["M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 4.76 7 3c-.29 1.76-1.14 3.13-2.29 4.06S3 11.09 3 12.25c0 2.22 1.8 4.05 4 4.05z", "M12.56 6.6A11 11 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"],
  yoga: [{ c: [12, 4, 1.6] }, "m9 20 3-6 3 6", "m6 9 6 2 6-2", "M12 11v3"],
  music: ["M9 18V5l12-2v13", { c: [6, 18, 3] }, { c: [18, 16, 3] }],
  ticket: ["M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z", "M13 5v2", "M13 17v2", "M13 11v2"],
  buoy: [{ c: [12, 12, 10] }, { c: [12, 12, 4] }, "m4.93 4.93 4.24 4.24", "m14.83 9.17 4.24-4.24", "m14.83 14.83 4.24 4.24", "m9.17 14.83-4.24 4.24"],
  sparkles: ["M9.94 14.34A2 2 0 0 0 8.5 12.9l-5.13-1.32a.5.5 0 0 1 0-.97L8.5 9.29a2 2 0 0 0 1.44-1.44l1.32-5.13a.5.5 0 0 1 .97 0l1.32 5.13a2 2 0 0 0 1.44 1.44l5.13 1.32a.5.5 0 0 1 0 .97l-5.13 1.32a2 2 0 0 0-1.44 1.44l-1.32 5.13a.5.5 0 0 1-.97 0z"],
  users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", { c: [9, 7, 4] }, "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  calendar: [{ r: [3, 4, 18, 18, 2] }, "M16 2v4", "M8 2v4", "M3 10h18"],
  beaker: ["M4.5 3h15", "M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3", "M6 14h12"],
  smile: [{ c: [12, 12, 10] }, "M8 14s1.5 2 4 2 4-2 4-2", "M9 9h.01", "M15 9h.01"],
  pin: ["M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0z", { c: [12, 10, 3] }],
  phone: ["M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"],
  mail: [{ r: [2, 4, 20, 16, 2] }, "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"],
  clock: [{ c: [12, 12, 10] }, "M12 6v6l4 2"],
  check: ["M20 6 9 17l-5-5"],
  camera: ["M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z", { c: [12, 13, 3] }],
};

export default function Icon({
  name,
  color = "currentColor",
  size = 24,
  sw = 2,
  style,
}: {
  name: string;
  color?: string;
  size?: number;
  sw?: number;
  style?: CSSProperties;
}) {
  const shapes = ICONS[name] ?? [];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {shapes.map((d, i) => {
        if (typeof d === "object" && "c" in d) return <circle key={i} cx={d.c[0]} cy={d.c[1]} r={d.c[2]} />;
        if (typeof d === "object" && "r" in d) return <rect key={i} x={d.r[0]} y={d.r[1]} width={d.r[2]} height={d.r[3]} rx={d.r[4]} />;
        return <path key={i} d={d} />;
      })}
    </svg>
  );
}

/** Convenience wrapper for the rounded, tinted icon tile used across the site. */
export function IconTile({
  name,
  color,
  tint,
  size = 28,
  className = "icon-tile",
}: {
  name: string;
  color: string;
  tint: string;
  size?: number;
  className?: string;
}) {
  return (
    <div className={className} style={{ background: tint }}>
      <Icon name={name} color={color} size={size} />
    </div>
  );
}
