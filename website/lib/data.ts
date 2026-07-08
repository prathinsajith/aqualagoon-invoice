/* ============================================================
   Aqua Lagoon — placeholder/fallback content.
   Fixed site constants (brand, nav, maps) live in ./constants.
   ============================================================ */

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

export type Faq = { q: string; a: string };
export const FAQS: Faq[] = [
  { q: "Where is Aqua Lagoon located?", a: "Aqua Lagoon is a swimming pool and wellness centre in Kayamkulam, Kerala. We welcome swimmers from Kayamkulam, Mavelikkara, Alappuzha, Oachira, Haripad, Kattanam, Krishnapuram, Nooranad, Bharanikkavu and nearby areas." },
  { q: "Do you offer swimming classes in Kayamkulam for kids and adults?", a: "Yes. We run structured learn-to-swim classes and coaching for all ages in Kayamkulam — from a child's first float to adult stroke technique — with certified coaches in small batches." },
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
export const SERVICE_OPTIONS = ["Learn to Swim (Kids)", "Learn to Swim (Adults)", "Open Swimming / Day Pass", "Yoga", "Zumba", "Auditorium Booking", "Something else"];

// Private-event booking form options.
export const EVENT_TYPE_OPTIONS = ["Birthday Party", "Corporate Event", "Private Party", "Kids Pool Party", "Other Celebration"];
export const GUEST_OPTIONS = ["1 - 10", "11 - 20", "21 - 50", "51 - 100", "100+"];
