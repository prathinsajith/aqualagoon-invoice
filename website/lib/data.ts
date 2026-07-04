/* ============================================================
   Aqua Lagoon — placeholder/fallback content.
   Fixed site constants (brand, nav, maps) live in ./constants.
   ============================================================ */

export type HeroStat = { value: string; label: string };
export const HERO_STATS: HeroStat[] = [
  { value: "500+", label: "HAPPY MEMBERS" },
  { value: "12+", label: "CERTIFIED COACHES" },
  { value: "6", label: "PROGRAMS" },
];

export type Service = {
  id: string;
  icon: string;
  color: string;
  tint: string;
  title: string;
  blurb: string;
  long: string;
  tags: string[];
  cta: string;
  photo: string;
  imgRight: boolean;
};
export const SERVICES: Service[] = [
  { id: "swim", icon: "waves", color: "#1479cf", tint: "#e0f4fd", title: "Open Swimming", blurb: "Day passes for lane swims and family splashes in clean, temperature-controlled water.", long: "Enjoy lane swimming, family sessions and open-water fun in our lifeguarded, temperature-controlled main pool. Day passes and monthly memberships available with towel and locker service.", tags: ["Day pass", "Lanes", "Family time"], cta: "Get a day pass", photo: "main pool", imgRight: false },
  { id: "learn", icon: "gradcap", color: "#2b6fd4", tint: "#e6f0fe", title: "Learn to Swim", blurb: "Structured lessons for kids and adults, from first floats to confident strokes.", long: "Certified coaches guide beginners to advanced swimmers through a proven curriculum. Small batches, water-safety focus and progress badges for kids. Free trial for first-timers.", tags: ["Kids & adults", "Small batches", "Free trial"], cta: "Book a free trial", photo: "coaching session", imgRight: true },
  { id: "park", icon: "droplets", color: "#0e9e8a", tint: "#e0f7f4", title: "Kids Water Park", blurb: "Slides, splash pads and shallow play zones designed just for little ones.", long: "A dedicated splash zone with gentle slides, mushroom fountains and shallow pools — all supervised and built for safe, giggly fun for younger children.", tags: ["Ages 3–10", "Supervised", "Slides"], cta: "Plan a visit", photo: "splash zone", imgRight: false },
  { id: "yoga", icon: "yoga", color: "#5b52c9", tint: "#eef0ff", title: "Yoga Classes", blurb: "Calm, guided mat and aqua yoga to stretch, breathe and unwind.", long: "Start or end your day with guided yoga — mat sessions and gentle aqua yoga. Suitable for all levels with experienced instructors and a calm studio space.", tags: ["All levels", "Morning & evening", "Aqua yoga"], cta: "Join a session", photo: "yoga studio", imgRight: true },
  { id: "zumba", icon: "music", color: "#c94f7c", tint: "#ffeef4", title: "Zumba Dance Fitness", blurb: "High-energy dance workouts that make getting fit feel like a party.", long: "Sweat it out to great music in our high-energy Zumba classes. A fun cardio workout for all fitness levels — no dance experience needed, just bring the energy.", tags: ["Cardio", "All levels", "Group fun"], cta: "Try a class", photo: "zumba floor", imgRight: false },
  { id: "audi", icon: "ticket", color: "#d08512", tint: "#fff4e2", title: "Mini Auditorium", blurb: "A versatile space for birthdays, workshops, functions and celebrations.", long: "Host birthdays, workshops, community events and functions in our mini auditorium. Flexible seating, sound system and easy booking by the hour — poolside celebrations made simple.", tags: ["Events", "Hourly", "Sound system"], cta: "Reserve the hall", photo: "event hall", imgRight: true },
];

export type Audience = { icon: string; color: string; tint: string; title: string; text: string };
export const AUDIENCES: Audience[] = [
  { icon: "gradcap", color: "#2b6fd4", tint: "#e6f0fe", title: "Kids & Learners", text: "Safe, structured lessons plus a splash-filled water park." },
  { icon: "yoga", color: "#5b52c9", tint: "#eef0ff", title: "Adults & Fitness", text: "Lap swims, calming yoga and high-energy zumba." },
  { icon: "users", color: "#0e9e8a", tint: "#e0f7f4", title: "Families", text: "Relaxed open-swim sessions the whole family enjoys." },
  { icon: "ticket", color: "#d08512", tint: "#fff4e2", title: "Events & Groups", text: "Book the mini auditorium for parties and functions." },
];

export type WhyFit = { img: string; title: string; text: string };
export const WHYFIT: WhyFit[] = [
  { img: "/assets/wf-instructor.png", title: "Experienced & Certified Instructors", text: "Learn from professionally certified swim coaches with years of experience teaching all ages and skill levels." },
  { img: "/assets/wf-family.png", title: "Personalized Lessons For Every Age", text: "Whether it's your toddler's first splash or you're an adult conquering a lifelong fear, we tailor every session to your pace." },
  { img: "/assets/wf-calendar.png", title: "Flexible Scheduling At Your Convenience", text: "Book sessions that fit your lifestyle — mornings, evenings or weekends, we work around your schedule." },
  { img: "/assets/wf-home.png", title: "Open Swim & Local Pool Options", text: "From lane swims to family sessions, our clean, lifeguarded pools are open all week for members and day-pass guests." },
  { img: "/assets/wf-safety.png", title: "Focused On Water Safety First", text: "We emphasize essential safety skills from day one, helping swimmers stay confident and protected in any water environment." },
  { img: "/assets/wf-progress.png", title: "Ongoing Progress Tracking & Feedback", text: "We keep you (or your child) motivated with regular updates, encouragement and clear milestones to celebrate improvement." },
];

export type WhyUs = { icon: string; color: string; tint: string; title: string; text: string };
export const WHYUS: WhyUs[] = [
  { icon: "buoy", color: "#1479cf", tint: "#e0f4fd", title: "Lifeguards on duty", text: "Trained lifeguards supervise every session, all day." },
  { icon: "sparkles", color: "#2b6fd4", tint: "#e6f0fe", title: "Crystal-clean water", text: "Filtered and tested daily for a safe, sparkling swim." },
  { icon: "users", color: "#0e9e8a", tint: "#e0f7f4", title: "For every age", text: "From toddlers to seniors — programs for the whole family." },
  { icon: "calendar", color: "#d08512", tint: "#fff4e2", title: "Flexible timings", text: "Morning to night slots that fit around your day." },
];

export type Slot = { label: string; color: string; bg: string };
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const SLOT: Record<string, Slot> = {
  A: { label: "Swim Coaching", color: "#0b6aab", bg: "#e0f4fd" },
  O: { label: "Open Swim", color: "#0e7a6b", bg: "#e0f7f4" },
  Y: { label: "Yoga", color: "#5b52c9", bg: "#eef0ff" },
  Z: { label: "Zumba", color: "#c94f7c", bg: "#ffeef4" },
  K: { label: "Kids Park", color: "#c47a12", bg: "#fff4e2" },
};
export const TIMETABLE: { time: string; cells: string[] }[] = [
  { time: "6–8 AM", cells: ["A", "A", "A", "A", "A"] },
  { time: "8–10 AM", cells: ["Y", "O", "Y", "O", "Y"] },
  { time: "10–1 PM", cells: ["K", "K", "K", "K", "K"] },
  { time: "4–6 PM", cells: ["A", "A", "A", "A", "A"] },
  { time: "6–8 PM", cells: ["Z", "O", "Z", "O", "Z"] },
];

export type Price = { name: string; price: string; unit: string; popular: boolean; features: string[]; btn: string };
export const PRICING: Price[] = [
  { name: "Day Pass", price: "₹300", unit: "/ visit", popular: false, features: ["Full pool access", "Locker & shower", "Kids park entry"], btn: "Buy pass" },
  { name: "Learn to Swim", price: "₹4,000", unit: "/ 12 sessions", popular: true, features: ["Certified coach", "Small batch (max 6)", "Progress badges", "Free trial included"], btn: "Enroll now" },
  { name: "Monthly Swim", price: "₹2,500", unit: "/ month", popular: false, features: ["Unlimited open swim", "Locker & towel", "10% guest discount"], btn: "Get membership" },
  { name: "Yoga + Zumba", price: "₹1,800", unit: "/ month", popular: false, features: ["All fitness classes", "Morning & evening", "Beginner friendly"], btn: "Join fitness" },
];

export type Faq = { q: string; a: string };
export const FAQS: Faq[] = [
  { q: "Do I need to know swimming to join?", a: "Not at all! Our Learn to Swim program starts from the very basics — water confidence and floating — for both kids and adults." },
  { q: "Is there a free trial?", a: "Yes. First-time swimmers get one free trial session. Just book through the contact form or call us." },
  { q: "What should I bring?", a: "A swimsuit, towel and swim cap. Lockers and showers are available on-site. Caps are also available at reception." },
  { q: "Can I book the auditorium for a birthday?", a: "Absolutely. The mini auditorium is billed hourly and can be combined with a pool session package. Reach out for availability." },
];

export type Testimonial = { quote: string; name: string; role: string };
export const TESTIMONIALS: Testimonial[] = [
  { quote: "My daughter went from scared of water to swimming a full lap in six weeks. The coaches are so patient and kind.", name: "Priya S.", role: "Parent · Learn to Swim" },
  { quote: "Cleanest pool in the city and the morning yoga is the perfect start to my day. Great value membership too.", name: "Rahul M.", role: "Monthly member" },
  { quote: "We hosted my son’s birthday at the auditorium and pool combo — the kids had a blast and setup was effortless.", name: "Anjali & Vivek", role: "Event booking" },
];

export type GalleryItem = { label: string; cat: string; icon: string; tint: string; ratio: string };
export const GALLERY: GalleryItem[] = [
  { label: "Morning lane swim", cat: "Pool", icon: "waves", tint: "linear-gradient(135deg,#7fd0f0,#1479cf)", ratio: "4/3" },
  { label: "Kids splash zone", cat: "Kids", icon: "droplets", tint: "linear-gradient(135deg,#8fe0d6,#0e9e8a)", ratio: "4/5" },
  { label: "Coaching in action", cat: "Pool", icon: "gradcap", tint: "linear-gradient(135deg,#9cc4fb,#1a5fd0)", ratio: "4/3" },
  { label: "Sunrise yoga", cat: "Yoga", icon: "yoga", tint: "linear-gradient(135deg,#b0b4f5,#5b52c9)", ratio: "4/3" },
  { label: "Zumba party", cat: "Zumba", icon: "music", tint: "linear-gradient(135deg,#f7a8c6,#c94f7c)", ratio: "4/5" },
  { label: "Birthday bash", cat: "Events", icon: "ticket", tint: "linear-gradient(135deg,#ffd58f,#e08a12)", ratio: "4/3" },
  { label: "Family fun day", cat: "Pool", icon: "users", tint: "linear-gradient(135deg,#7fd0f0,#0e7a6b)", ratio: "4/3" },
  { label: "Little swimmers", cat: "Kids", icon: "droplets", tint: "linear-gradient(135deg,#8fe0d6,#1479cf)", ratio: "4/3" },
  { label: "Community workshop", cat: "Events", icon: "ticket", tint: "linear-gradient(135deg,#ffd58f,#c47a12)", ratio: "4/5" },
];
export const GALLERY_CATS = ["all", "Pool", "Kids", "Yoga", "Zumba", "Events"];

export type Stat = { value: string; label: string };
export const ABOUT_STATS: Stat[] = [
  { value: "500+", label: "Active members" },
  { value: "6", label: "Programs" },
  { value: "12+", label: "Coaches" },
  { value: "8yr", label: "Serving families" },
];

export type Safety = { icon: string; color: string; tint: string; title: string; text: string };
export const SAFETY: Safety[] = [
  { icon: "buoy", color: "#1479cf", tint: "#e0f4fd", title: "Certified lifeguards", text: "Trained lifeguards supervise all sessions with first-aid readiness." },
  { icon: "beaker", color: "#0e9e8a", tint: "#e0f7f4", title: "Daily water testing", text: "pH and chlorine checked and logged multiple times daily." },
  { icon: "smile", color: "#d08512", tint: "#fff4e2", title: "Kid-safe zones", text: "Shallow, fenced play areas designed specifically for young children." },
];

export type ContactInfo = { icon: string; color: string; tint: string; title: string; value: string };
export const CONTACT_INFO: ContactInfo[] = [
  { icon: "pin", color: "#1479cf", tint: "#e0f4fd", title: "Visit us", value: "Aqua Lagoon, Main Road, Your City" },
  { icon: "phone", color: "#2b6fd4", tint: "#e6f0fe", title: "Call / WhatsApp", value: "+91 98765 43210" },
  { icon: "mail", color: "#0e9e8a", tint: "#e0f7f4", title: "Email", value: "hello@aqualagoon.com" },
  { icon: "clock", color: "#d08512", tint: "#fff4e2", title: "Open hours", value: "Mon–Sat 6 AM–9 PM · Sun 7 AM–6 PM" },
];
export const SERVICE_OPTIONS = ["Learn to Swim (Kids)", "Learn to Swim (Adults)", "Open Swimming / Day Pass", "Kids Water Park", "Yoga", "Zumba", "Auditorium Booking", "Something else"];
