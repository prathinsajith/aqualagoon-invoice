import { z } from "zod";

/**
 * Editable content for the public marketing website, one Zod schema per section.
 * Every field has a default, so `schema.parse({})` yields the full default
 * document — the public endpoint always returns complete content even before an
 * admin has saved anything.
 */

// ---- Homepage / hero -------------------------------------------------------
const statSchema = z.object({
  value: z.string().trim().min(1).max(12),
  label: z.string().trim().min(1).max(40),
});

export const homepageSchema = z.object({
  heroKicker: z.string().trim().max(120).default("Your swim journey starts here."),
  heroLead: z
    .string()
    .trim()
    .max(600)
    .default(
      "Certified coaches, sparkling water and programs for every age — swimming lessons, open swims and a kids' water park, plus yoga, zumba and a mini auditorium built to inspire, refresh and last.",
    ),
  heroImageUrl: z.string().trim().max(500).default("/assets/hero.webp"),
  // Optional photo for the "A safe splash for every age" tile (empty = placeholder).
  whyUsImageUrl: z.string().trim().max(500).default("/assets/wf-pool.webp"),
  stats: z
    .array(statSchema)
    .max(4)
    .default([
      { value: "500+", label: "HAPPY MEMBERS" },
      { value: "12+", label: "CERTIFIED COACHES" },
      { value: "6", label: "PROGRAMS" },
    ]),
});

// ---- Contact & hours -------------------------------------------------------
// Default to the brand's profile pages so the social features render out of the
// box; the admin replaces these with the real handles in Contact & Hours.
const socialSchema = z.object({
  facebook: z.string().trim().max(300).default("https://www.facebook.com/aqualagoon"),
  instagram: z.string().trim().max(300).default("https://www.instagram.com/aqualagoon"),
  x: z.string().trim().max(300).default("https://x.com/aqualagoon"),
  youtube: z.string().trim().max(300).default("https://www.youtube.com/@aqualagoon"),
  whatsapp: z.string().trim().max(300).default("https://wa.me/919876543210"),
});

export const contactSchema = z.object({
  address: z.string().trim().max(200).default("Aqua Lagoon, Main Road, Your City"),
  phone: z.string().trim().max(60).default("+91 98765 43210"),
  email: z.string().trim().max(120).default("hello@aqualagoon.com"),
  hoursWeekday: z.string().trim().max(120).default("Mon–Sat 6:00 AM – 9:00 PM"),
  hoursSunday: z.string().trim().max(120).default("Sunday 7:00 AM – 6:00 PM"),
  social: socialSchema.default({
    facebook: "https://www.facebook.com/aqualagoon",
    instagram: "https://www.instagram.com/aqualagoon",
    x: "https://x.com/aqualagoon",
    youtube: "https://www.youtube.com/@aqualagoon",
    whatsapp: "https://wa.me/919876543210",
  }),
});

// ---- Services --------------------------------------------------------------
const serviceSchema = z.object({
  id: z.string().trim().min(1).max(40),
  icon: z.string().trim().min(1).max(30),
  color: z.string().trim().max(20),
  tint: z.string().trim().max(20),
  title: z.string().trim().min(1).max(80),
  blurb: z.string().trim().max(240),
  long: z.string().trim().max(1000),
  tags: z.array(z.string().trim().max(40)).max(6).default([]),
  cta: z.string().trim().max(60).default("Learn more"),
  imgRight: z.boolean().default(false),
  // Optional photo for the service (empty = the icon placeholder is shown).
  imageUrl: z.string().trim().max(500).default(""),
});

export const servicesSchema = z.object({
  items: z
    .array(serviceSchema)
    .max(12)
    .default([
      { id: "swim", icon: "waves", color: "#1479cf", tint: "#e0f4fd", title: "Open Swimming", blurb: "Day passes for lane swims and family splashes in clean, temperature-controlled water.", long: "Enjoy lane swimming, family sessions and open-water fun in our lifeguarded, temperature-controlled main pool. Day passes and monthly memberships available with towel and locker service.", tags: ["Day pass", "Lanes", "Family time"], cta: "Get a day pass", imgRight: false, imageUrl: "/assets/svc-swim.webp" },
      { id: "learn", icon: "gradcap", color: "#2b6fd4", tint: "#e6f0fe", title: "Learn to Swim", blurb: "Structured lessons for kids and adults, from first floats to confident strokes.", long: "Certified coaches guide beginners to advanced swimmers through a proven curriculum. Small batches, water-safety focus and progress badges for kids. Free trial for first-timers.", tags: ["Kids & adults", "Small batches", "Free trial"], cta: "Book a free trial", imgRight: true, imageUrl: "/assets/svc-learn.webp" },
      { id: "yoga", icon: "yoga", color: "#5b52c9", tint: "#eef0ff", title: "Yoga Classes", blurb: "Calm, guided mat and aqua yoga to stretch, breathe and unwind.", long: "Start or end your day with guided yoga — mat sessions and gentle aqua yoga. Suitable for all levels with experienced instructors and a calm studio space.", tags: ["All levels", "Morning & evening", "Aqua yoga"], cta: "Join a session", imgRight: true, imageUrl: "/assets/svc-yoga.webp" },
      { id: "zumba", icon: "music", color: "#c94f7c", tint: "#ffeef4", title: "Zumba Dance Fitness", blurb: "High-energy dance workouts that make getting fit feel like a party.", long: "Sweat it out to great music in our high-energy Zumba classes. A fun cardio workout for all fitness levels — no dance experience needed, just bring the energy.", tags: ["Cardio", "All levels", "Group fun"], cta: "Try a class", imgRight: false, imageUrl: "/assets/svc-zumba.webp" },
      { id: "audi", icon: "ticket", color: "#d08512", tint: "#fff4e2", title: "Mini Auditorium", blurb: "A versatile space for birthdays, workshops, functions and celebrations.", long: "Host birthdays, workshops, community events and functions in our mini auditorium. Flexible seating, sound system and easy booking by the hour — poolside celebrations made simple.", tags: ["Events", "Hourly", "Sound system"], cta: "Reserve the hall", imgRight: true, imageUrl: "/assets/svc-audi.webp" },
    ]),
});

// ---- About page ------------------------------------------------------------
const safetyCardSchema = z.object({
  icon: z.string().trim().min(1).max(30),
  color: z.string().trim().max(20),
  tint: z.string().trim().max(20),
  title: z.string().trim().min(1).max(80),
  text: z.string().trim().max(400),
});

export const aboutSchema = z.object({
  title: z.string().trim().max(120).default("About Aqua Lagoon"),
  intro: z
    .string()
    .trim()
    .max(600)
    .default(
      "We built Aqua Lagoon to be the friendliest, safest place in town to learn, swim, move and celebrate — for kids and grown-ups alike.",
    ),
  // Optional photo for the About "our facility" tile (empty = placeholder).
  imageUrl: z.string().trim().max(500).default("/assets/about-facility.webp"),
  storyTitle: z.string().trim().max(120).default("More than a pool"),
  storyParagraphs: z
    .array(z.string().trim().max(1000))
    .max(6)
    .default([
      "What started as a single training pool has grown into a full aquatic and wellness centre. Today we welcome hundreds of families each week for swim lessons, open swims, a splash-filled kids' water park, plus yoga and zumba to keep the whole family moving.",
      "Our mini auditorium hosts birthdays, workshops and community functions — because the water is only part of the fun.",
    ]),
  stats: z
    .array(statSchema)
    .max(6)
    .default([
      { value: "500+", label: "Active members" },
      { value: "6", label: "Programs" },
      { value: "12+", label: "Coaches" },
      { value: "8yr", label: "Serving families" },
    ]),
  safety: z
    .array(safetyCardSchema)
    .max(6)
    .default([
      { icon: "buoy", color: "#1479cf", tint: "#e0f4fd", title: "Certified lifeguards", text: "Trained lifeguards supervise all sessions with first-aid readiness." },
      { icon: "beaker", color: "#0e9e8a", tint: "#e0f7f4", title: "Daily water testing", text: "pH and chlorine checked and logged multiple times daily." },
      { icon: "smile", color: "#d08512", tint: "#fff4e2", title: "Kid-safe zones", text: "Shallow, fenced play areas designed specifically for young children." },
    ]),
  // "The pool & swimming" feature cards.
  highlightsTitle: z.string().trim().max(120).default("The pool & swimming"),
  highlights: z
    .array(safetyCardSchema)
    .max(8)
    .default([
      { icon: "droplets", color: "#1479cf", tint: "#e0f4fd", title: "Temperature-controlled water", text: "A clean, comfortably warm main pool — filtered and tested daily so every swim feels great, all year round." },
      { icon: "waves", color: "#0e9e8a", tint: "#e0f7f4", title: "Lanes & open swim", text: "Dedicated lanes for training and lessons, plus relaxed open-swim sessions the whole family can enjoy." },
      { icon: "gradcap", color: "#2b6fd4", tint: "#e6f0fe", title: "Certified coaches", text: "Professionally certified swim coaches guide every age and level through a proven, confidence-building curriculum." },
      { icon: "buoy", color: "#c94f7c", tint: "#ffeef4", title: "Water-safety first", text: "Essential water-safety and survival skills are built into every program from the very first session." },
      { icon: "droplets", color: "#0e9e8a", tint: "#e0f7f4", title: "Kids' shallow zone", text: "A supervised, shallow splash area with gentle play features designed for little ones to enjoy safely." },
      { icon: "users", color: "#5b52c9", tint: "#eef0ff", title: "Small batches", text: "Learn-to-swim runs in small batches (max 6 per coach) so every swimmer gets real personal attention." },
    ]),
  // "Class details at a glance" — quick label/value facts.
  classInfoTitle: z.string().trim().max(120).default("Class details at a glance"),
  classInfo: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(60),
        value: z.string().trim().min(1).max(160),
      }),
    )
    .max(10)
    .default([
      { label: "Ages", value: "4 years & up (kids, teens & adults)" },
      { label: "Batch size", value: "Max 6 swimmers per coach" },
      { label: "Levels", value: "Beginner → Intermediate → Advanced" },
      { label: "Session length", value: "45 minutes" },
      { label: "Free trial", value: "Yes — for first-time swimmers" },
      { label: "Timings", value: "Mornings, evenings & weekends" },
    ]),
});

// ---- Timetable -------------------------------------------------------------
const slotSchema = z.object({
  key: z.string().trim().min(1).max(20),
  label: z.string().trim().min(1).max(40),
  color: z.string().trim().max(20),
  bg: z.string().trim().max(20),
});
const rowSchema = z.object({
  time: z.string().trim().min(1).max(30),
  // Each entry is a slot `key` (or "" for an empty cell), aligned to `days`.
  cells: z.array(z.string().trim().max(20)).max(7).default([]),
});

export const timetableSchema = z.object({
  days: z.array(z.string().trim().min(1).max(12)).max(7).default(["Mon", "Tue", "Wed", "Thu", "Fri"]),
  slots: z
    .array(slotSchema)
    .max(12)
    .default([
      { key: "A", label: "Swim Coaching", color: "#0b6aab", bg: "#e0f4fd" },
      { key: "O", label: "Open Swim", color: "#0e7a6b", bg: "#e0f7f4" },
      { key: "Y", label: "Yoga", color: "#5b52c9", bg: "#eef0ff" },
      { key: "Z", label: "Zumba", color: "#ad3363", bg: "#ffeef4" },
      { key: "K", label: "Kids Park", color: "#9a5f0b", bg: "#fff4e2" },
    ]),
  rows: z
    .array(rowSchema)
    .max(12)
    .default([
      { time: "6–8 AM", cells: ["A", "A", "A", "A", "A"] },
      { time: "8–10 AM", cells: ["Y", "O", "Y", "O", "Y"] },
      { time: "10–1 PM", cells: ["K", "K", "K", "K", "K"] },
      { time: "4–6 PM", cells: ["A", "A", "A", "A", "A"] },
      { time: "6–8 PM", cells: ["Z", "O", "Z", "O", "Z"] },
    ]),
});

// ---- Membership & passes (pricing) -----------------------------------------
const planSchema = z.object({
  id: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(60),
  price: z.string().trim().max(20),
  unit: z.string().trim().max(30),
  popular: z.boolean().default(false),
  features: z.array(z.string().trim().max(100)).max(10).default([]),
  btn: z.string().trim().max(40).default("Choose"),
});

export const pricingSchema = z.object({
  plans: z
    .array(planSchema)
    .max(8)
    .default([
      { id: "day", name: "Day Pass", price: "₹300", unit: "/ visit", popular: false, features: ["Full pool access", "Locker & shower", "Kids park entry"], btn: "Buy pass" },
      { id: "learn", name: "Learn to Swim", price: "₹4,000", unit: "/ 12 sessions", popular: true, features: ["Certified coach", "Small batch (max 6)", "Progress badges", "Free trial included"], btn: "Enroll now" },
      { id: "monthly", name: "Monthly Swim", price: "₹2,500", unit: "/ month", popular: false, features: ["Unlimited open swim", "Locker & towel", "10% guest discount"], btn: "Get membership" },
      { id: "fitness", name: "Yoga + Zumba", price: "₹1,800", unit: "/ month", popular: false, features: ["All fitness classes", "Morning & evening", "Beginner friendly"], btn: "Join fitness" },
    ]),
  note: z
    .string()
    .trim()
    .max(200)
    .default("All prices incl. taxes · Family & annual discounts available · Auditorium billed hourly"),
});

// ---- Branding & SEO --------------------------------------------------------
export const brandingSchema = z.object({
  logoUrl: z.string().trim().max(500).default("/assets/logo-160.webp"),
  metaTitle: z.string().trim().max(160).default("Aqua Lagoon — Swimming Pool, Wellness & Events"),
  metaDescription: z
    .string()
    .trim()
    .max(320)
    .default(
      "Aqua Lagoon is a swimming pool, kids' water park and wellness centre. Swim lessons, open swims, yoga, zumba and a mini auditorium for events — safe splashes for every age.",
    ),
  ogImageUrl: z.string().trim().max(500).default("/assets/og-image.jpg"),
});

/** All sections, keyed. The key is the primary key of the `site_content` row. */
export const SECTION_SCHEMAS = {
  homepage: homepageSchema,
  about: aboutSchema,
  contact: contactSchema,
  services: servicesSchema,
  pricing: pricingSchema,
  timetable: timetableSchema,
  branding: brandingSchema,
} as const;

export type SectionKey = keyof typeof SECTION_SCHEMAS;
export const SECTION_KEYS = Object.keys(SECTION_SCHEMAS) as SectionKey[];

/** The full public content document. */
export const siteContentSchema = z.object({
  homepage: homepageSchema,
  about: aboutSchema,
  contact: contactSchema,
  services: servicesSchema,
  pricing: pricingSchema,
  timetable: timetableSchema,
  branding: brandingSchema,
});

export const sectionKeyParams = z.object({
  key: z.enum(SECTION_KEYS as [SectionKey, ...SectionKey[]]),
});
