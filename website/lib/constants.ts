/**
 * Site-wide constants — the single source of truth for values that are fixed
 * (brand identity, navigation, the map location) as opposed to editable content,
 * which lives in the CMS (`site-content`). Change a value here once and it
 * updates everywhere it's used.
 */

/** Brand identity used across the header, footer, metadata and structured data. */
export const BRAND = {
  /** Title-case name, e.g. in the hero and metadata. */
  name: "Aqua Lagoon",
  /** All-caps wordmark used in the header/footer logo lockup. */
  shortName: "AQUA LAGOON",
  /** Sub-wordmark tagline. */
  tagline: "SWIMMING · WELLNESS · EVENTS",
} as const;

/** schema.org business type for the JSON-LD structured data. */
export const ORG_TYPE = "SportsActivityLocation";

/**
 * Physical location + service area — powers local SEO (structured data, titles,
 * the footer "areas served" line). VERIFY the postal code and geo coordinates
 * against the real venue; approximate values hurt local ranking.
 */
export const LOCATION = {
  locality: "Kayamkulam",
  region: "Kerala",
  postalCode: "690537",
  country: "IN",
  // Approx. Kayamkulam town centre — replace with the venue's exact pin.
  geo: { latitude: 9.1746, longitude: 76.501 },
  /**
   * Towns the pool draws swimmers from — the local search terms to rank for.
   * Trim any that are too far to genuinely serve; keep the nearest first.
   */
  areasServed: [
    "Kayamkulam",
    "Mavelikkara",
    "Alappuzha",
    "Oachira",
    "Haripad",
    "Kattanam",
    "Krishnapuram",
    "Karthikappally",
    "Nooranad",
    "Bharanikkavu",
    "Thamarakulam",
    "Cheppad",
    "Karuvatta",
    "Chengannur",
  ],
} as const;

/**
 * Human-readable service-area line for the footer. Shows the nearest towns
 * (the full list drives the structured-data `areaServed`), then "& nearby".
 */
export const SERVICE_AREA_TEXT = (() => {
  const primary = LOCATION.areasServed.slice(0, 6);
  return `Serving ${primary.slice(0, -1).join(", ")} & ${primary.at(-1)} and nearby areas`;
})();

/**
 * Google Maps location (Aqua Lagoon, Kayamkulam).
 * `link` opens the place / directions; `embedUrl` is a keyless iframe embed.
 */
export const MAPS = {
  link: "https://www.google.com/maps/place/aqua+lagoon+kayamkulam/data=!4m2!3m1!1s0x3b061d4609151b7f:0x8bb99413b4c4eca",
  // Keyless iframe embed. `maps.google.com/maps?...&output=embed` is the form
  // that reliably allows framing (the www.google.com/maps variant can be refused).
  embedUrl:
    "https://maps.google.com/maps?q=Aqua%20Lagoon%20Kayamkulam&t=&z=15&ie=UTF8&iwloc=&output=embed",
} as const;

/** Primary navigation. */
export type NavItem = { id: string; label: string; href: string };

export const NAV: NavItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "services", label: "Services", href: "/services" },
  { id: "classes", label: "Classes & Pricing", href: "/classes" },
  { id: "gallery", label: "Gallery", href: "/gallery" },
  { id: "about", label: "About", href: "/about" },
  { id: "contact", label: "Contact", href: "/contact" },
];

/** Resolves a pathname to the active nav id (for highlighting). */
export function activeNavId(pathname: string): string {
  const match = NAV.find((n) => n.href !== "/" && pathname.startsWith(n.href));
  return match ? match.id : "home";
}
