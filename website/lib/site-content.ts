import { API_URL } from "./env";

/* Shapes mirror the backend `site-content` sections. */
export interface HomepageContent {
  heroKicker: string;
  heroLead: string;
  heroImageUrl: string;
  whyUsImageUrl: string;
  stats: { value: string; label: string }[];
}
export interface SocialLinks {
  facebook: string;
  instagram: string;
  x: string;
  youtube: string;
  whatsapp: string;
}
export interface ContactContent {
  address: string;
  phone: string;
  email: string;
  hoursWeekday: string;
  hoursSunday: string;
  social: SocialLinks;
}
export interface ServiceItem {
  id: string;
  icon: string;
  color: string;
  tint: string;
  title: string;
  blurb: string;
  long: string;
  tags: string[];
  cta: string;
  imgRight: boolean;
  imageUrl: string;
}
export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  unit: string;
  popular: boolean;
  features: string[];
  btn: string;
}
export interface PricingContent {
  plans: PricingPlan[];
  note: string;
}
export interface SafetyCard {
  icon: string;
  color: string;
  tint: string;
  title: string;
  text: string;
}
export interface AboutContent {
  title: string;
  intro: string;
  imageUrl: string;
  storyTitle: string;
  storyParagraphs: string[];
  stats: { value: string; label: string }[];
  safety: SafetyCard[];
  highlightsTitle: string;
  highlights: SafetyCard[];
  classInfoTitle: string;
  classInfo: { label: string; value: string }[];
}
export interface TimetableSlot {
  key: string;
  label: string;
  color: string;
  bg: string;
}
export interface TimetableRow {
  time: string;
  cells: string[];
}
export interface TimetableContent {
  days: string[];
  slots: TimetableSlot[];
  rows: TimetableRow[];
}
export interface BrandingContent {
  logoUrl: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
}
export interface SiteContent {
  homepage: HomepageContent;
  about: AboutContent;
  contact: ContactContent;
  services: ServiceItem[]; // flattened from { items }
  pricing: PricingContent;
  timetable: TimetableContent;
  branding: BrandingContent;
}

/** Defaults — used until an admin saves, and as a fallback if the API is down. */
const DEFAULT_CONTENT: SiteContent = {
  homepage: {
    heroKicker: "Your swim journey starts here.",
    heroLead:
      "Certified coaches, sparkling water and programs for every age — swimming lessons, open swims and a kids' water park, plus yoga, zumba and a mini auditorium built to inspire, refresh and last.",
    heroImageUrl: "/assets/hero.webp",
    whyUsImageUrl: "/assets/wf-pool.webp",
    stats: [
      { value: "500+", label: "HAPPY MEMBERS" },
      { value: "12+", label: "CERTIFIED COACHES" },
      { value: "6", label: "PROGRAMS" },
    ],
  },
  contact: {
    address: "Aqua Lagoon, Main Road, Your City",
    phone: "+91 98765 43210",
    email: "hello@aqualagoon.com",
    hoursWeekday: "Mon–Sat 6:00 AM – 9:00 PM",
    hoursSunday: "Sunday 7:00 AM – 6:00 PM",
    social: {
      facebook: "https://www.facebook.com/aqualagoon",
      instagram: "https://www.instagram.com/aqualagoon",
      x: "https://x.com/aqualagoon",
      youtube: "https://www.youtube.com/@aqualagoon",
      whatsapp: "https://wa.me/919876543210",
    },
  },
  services: [
    { id: "swim", icon: "waves", color: "#1479cf", tint: "#e0f4fd", title: "Open Swimming", blurb: "Day passes for lane swims and family splashes in clean, temperature-controlled water.", long: "Enjoy lane swimming, family sessions and open-water fun in our lifeguarded, temperature-controlled main pool. Day passes and monthly memberships available with towel and locker service.", tags: ["Day pass", "Lanes", "Family time"], cta: "Get a day pass", imgRight: false, imageUrl: "/assets/svc-swim.webp" },
    { id: "learn", icon: "gradcap", color: "#2b6fd4", tint: "#e6f0fe", title: "Learn to Swim", blurb: "Structured lessons for kids and adults, from first floats to confident strokes.", long: "Certified coaches guide beginners to advanced swimmers through a proven curriculum. Small batches, water-safety focus and progress badges for kids. Free trial for first-timers.", tags: ["Kids & adults", "Small batches", "Free trial"], cta: "Book a free trial", imgRight: true, imageUrl: "/assets/svc-learn.webp" },
    { id: "yoga", icon: "yoga", color: "#5b52c9", tint: "#eef0ff", title: "Yoga Classes", blurb: "Calm, guided mat and aqua yoga to stretch, breathe and unwind.", long: "Start or end your day with guided yoga — mat sessions and gentle aqua yoga. Suitable for all levels with experienced instructors and a calm studio space.", tags: ["All levels", "Morning & evening", "Aqua yoga"], cta: "Join a session", imgRight: true, imageUrl: "/assets/svc-yoga.webp" },
    { id: "zumba", icon: "music", color: "#c94f7c", tint: "#ffeef4", title: "Zumba Dance Fitness", blurb: "High-energy dance workouts that make getting fit feel like a party.", long: "Sweat it out to great music in our high-energy Zumba classes. A fun cardio workout for all fitness levels — no dance experience needed, just bring the energy.", tags: ["Cardio", "All levels", "Group fun"], cta: "Try a class", imgRight: false, imageUrl: "/assets/svc-zumba.webp" },
    { id: "audi", icon: "ticket", color: "#d08512", tint: "#fff4e2", title: "Mini Auditorium", blurb: "A versatile space for birthdays, workshops, functions and celebrations.", long: "Host birthdays, workshops, community events and functions in our mini auditorium. Flexible seating, sound system and easy booking by the hour — poolside celebrations made simple.", tags: ["Events", "Hourly", "Sound system"], cta: "Reserve the hall", imgRight: true, imageUrl: "/assets/svc-audi.webp" },
  ],
  about: {
    title: "About Aqua Lagoon",
    intro:
      "We built Aqua Lagoon to be the friendliest, safest place in town to learn, swim, move and celebrate — for kids and grown-ups alike.",
    imageUrl: "/assets/about-facility.webp",
    storyTitle: "More than a pool",
    storyParagraphs: [
      "What started as a single training pool has grown into a full aquatic and wellness centre. Today we welcome hundreds of families each week for swim lessons, open swims, a splash-filled kids' water park, plus yoga and zumba to keep the whole family moving.",
      "Our mini auditorium hosts birthdays, workshops and community functions — because the water is only part of the fun.",
    ],
    stats: [
      { value: "500+", label: "Active members" },
      { value: "6", label: "Programs" },
      { value: "12+", label: "Coaches" },
      { value: "8yr", label: "Serving families" },
    ],
    safety: [
      { icon: "buoy", color: "#1479cf", tint: "#e0f4fd", title: "Certified lifeguards", text: "Trained lifeguards supervise all sessions with first-aid readiness." },
      { icon: "beaker", color: "#0e9e8a", tint: "#e0f7f4", title: "Daily water testing", text: "pH and chlorine checked and logged multiple times daily." },
      { icon: "smile", color: "#d08512", tint: "#fff4e2", title: "Kid-safe zones", text: "Shallow, fenced play areas designed specifically for young children." },
    ],
    highlightsTitle: "The pool & swimming",
    highlights: [
      { icon: "droplets", color: "#1479cf", tint: "#e0f4fd", title: "Temperature-controlled water", text: "A clean, comfortably warm main pool — filtered and tested daily so every swim feels great, all year round." },
      { icon: "waves", color: "#0e9e8a", tint: "#e0f7f4", title: "Lanes & open swim", text: "Dedicated lanes for training and lessons, plus relaxed open-swim sessions the whole family can enjoy." },
      { icon: "gradcap", color: "#2b6fd4", tint: "#e6f0fe", title: "Certified coaches", text: "Professionally certified swim coaches guide every age and level through a proven, confidence-building curriculum." },
      { icon: "buoy", color: "#c94f7c", tint: "#ffeef4", title: "Water-safety first", text: "Essential water-safety and survival skills are built into every program from the very first session." },
      { icon: "droplets", color: "#0e9e8a", tint: "#e0f7f4", title: "Kids' shallow zone", text: "A supervised, shallow splash area with gentle play features designed for little ones to enjoy safely." },
      { icon: "users", color: "#5b52c9", tint: "#eef0ff", title: "Small batches", text: "Learn-to-swim runs in small batches (max 6 per coach) so every swimmer gets real personal attention." },
    ],
    classInfoTitle: "Class details at a glance",
    classInfo: [
      { label: "Ages", value: "4 years & up (kids, teens & adults)" },
      { label: "Batch size", value: "Max 6 swimmers per coach" },
      { label: "Levels", value: "Beginner → Intermediate → Advanced" },
      { label: "Session length", value: "45 minutes" },
      { label: "Free trial", value: "Yes — for first-time swimmers" },
      { label: "Timings", value: "Mornings, evenings & weekends" },
    ],
  },
  pricing: {
    plans: [
      { id: "day", name: "Day Pass", price: "₹300", unit: "/ visit", popular: false, features: ["Full pool access", "Locker & shower", "Kids park entry"], btn: "Buy pass" },
      { id: "learn", name: "Learn to Swim", price: "₹4,000", unit: "/ 12 sessions", popular: true, features: ["Certified coach", "Small batch (max 6)", "Progress badges", "Free trial included"], btn: "Enroll now" },
      { id: "monthly", name: "Monthly Swim", price: "₹2,500", unit: "/ month", popular: false, features: ["Unlimited open swim", "Locker & towel", "10% guest discount"], btn: "Get membership" },
      { id: "fitness", name: "Yoga + Zumba", price: "₹1,800", unit: "/ month", popular: false, features: ["All fitness classes", "Morning & evening", "Beginner friendly"], btn: "Join fitness" },
    ],
    note: "All prices incl. taxes · Family & annual discounts available · Auditorium billed hourly",
  },
  timetable: {
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    slots: [
      { key: "A", label: "Swim Coaching", color: "#0b6aab", bg: "#e0f4fd" },
      { key: "O", label: "Open Swim", color: "#0e7a6b", bg: "#e0f7f4" },
      { key: "Y", label: "Yoga", color: "#5b52c9", bg: "#eef0ff" },
      { key: "Z", label: "Zumba", color: "#ad3363", bg: "#ffeef4" },
      { key: "K", label: "Kids Park", color: "#9a5f0b", bg: "#fff4e2" },
    ],
    rows: [
      { time: "6–8 AM", cells: ["A", "A", "A", "A", "A"] },
      { time: "8–10 AM", cells: ["Y", "O", "Y", "O", "Y"] },
      { time: "10–1 PM", cells: ["K", "K", "K", "K", "K"] },
      { time: "4–6 PM", cells: ["A", "A", "A", "A", "A"] },
      { time: "6–8 PM", cells: ["Z", "O", "Z", "O", "Z"] },
    ],
  },
  branding: {
    logoUrl: "/assets/logo-160.webp",
    metaTitle: "Aqua Lagoon — Swimming Pool in Kayamkulam, Kerala",
    metaDescription:
      "Aqua Lagoon is a swimming pool & wellness centre in Kayamkulam, Kerala — swimming lessons, open swims, yoga, zumba and a mini auditorium. Serving Kayamkulam, Mavelikkara, Alappuzha & Oachira.",
    ogImageUrl: "/assets/og-image.jpg",
  },
};

/**
 * Resolves a content image URL. Bundled defaults (`/assets/…`) are served by the
 * website itself; uploaded images (`/api/files/…`) are served by the backend.
 */
export function contentImage(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("/assets")) return url;
  return `${API_URL}${url}`;
}

interface ApiResponse {
  data?: {
    homepage?: HomepageContent;
    about?: AboutContent;
    contact?: ContactContent;
    services?: { items?: ServiceItem[] };
    pricing?: PricingContent;
    timetable?: TimetableContent;
    branding?: BrandingContent;
  };
}

/**
 * Fetches the full site content from the backend (server-side). Cached so pages
 * render instantly without a per-request backend round-trip; the backend calls
 * /api/revalidate on save so edits still appear at once, with a 1-hour fallback
 * refresh. Falls back to DEFAULT_CONTENT if the API is unreachable.
 */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const res = await fetch(`${API_URL}/api/site-content`, { next: { revalidate: 3600 } });
    if (!res.ok) return DEFAULT_CONTENT;
    const json = (await res.json()) as ApiResponse;
    const d = json.data;
    if (!d) return DEFAULT_CONTENT;
    return {
      homepage: d.homepage ?? DEFAULT_CONTENT.homepage,
      about: d.about ?? DEFAULT_CONTENT.about,
      contact: d.contact ?? DEFAULT_CONTENT.contact,
      services: d.services?.items ?? DEFAULT_CONTENT.services,
      pricing: d.pricing ?? DEFAULT_CONTENT.pricing,
      timetable: d.timetable ?? DEFAULT_CONTENT.timetable,
      branding: d.branding ?? DEFAULT_CONTENT.branding,
    };
  } catch {
    return DEFAULT_CONTENT;
  }
}
