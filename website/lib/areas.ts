/**
 * Service-area landing pages — one per surrounding town so the site can rank
 * for "swimming pool in <town>". Kayamkulam is intentionally excluded: the
 * homepage already targets it, and a second page would compete with it.
 *
 * Each area has a genuinely distinct intro (not a duplicated template) so these
 * are useful local pages, not thin doorway pages.
 */
export type Area = { slug: string; name: string; blurb: string };

export const AREAS: Area[] = [
  { slug: "mavelikkara", name: "Mavelikkara", blurb: "Just a short drive from Mavelikkara, Aqua Lagoon gives families a clean, lifeguarded pool and certified swim coaches — a convenient home for lessons, open swims and fitness classes." },
  { slug: "alappuzha", name: "Alappuzha", blurb: "Swimmers from across the Alappuzha region train at Aqua Lagoon, with structured learn-to-swim batches for kids and adults plus yoga and zumba, all in one temperature-controlled centre." },
  { slug: "oachira", name: "Oachira", blurb: "For Oachira residents, Aqua Lagoon is the nearby choice for swimming lessons and open swims — small batches, water-safety-first coaching and flexible morning-to-evening slots." },
  { slug: "haripad", name: "Haripad", blurb: "Families from Haripad come to Aqua Lagoon for confident, step-by-step swim coaching in a safe, sparkling pool, with day passes and monthly memberships to suit every routine." },
  { slug: "kattanam", name: "Kattanam", blurb: "Aqua Lagoon welcomes swimmers from Kattanam with certified coaches, small learn-to-swim batches and open-swim sessions the whole family can enjoy." },
  { slug: "krishnapuram", name: "Krishnapuram", blurb: "Close to Krishnapuram, Aqua Lagoon offers lane swims, kids' and adults' lessons, yoga and zumba under one roof — a friendly, lifeguarded space for water and wellness." },
  { slug: "karthikappally", name: "Karthikappally", blurb: "Swimmers from Karthikappally learn and train at Aqua Lagoon, where certified coaches guide first-timers all the way to confident strokes in a clean, supervised pool." },
  { slug: "nooranad", name: "Nooranad", blurb: "For Nooranad families, Aqua Lagoon is a convenient swimming and wellness centre — learn-to-swim programs, open swims and fitness classes with experienced instructors." },
  { slug: "bharanikkavu", name: "Bharanikkavu", blurb: "Aqua Lagoon serves the Bharanikkavu area with safe, structured swimming lessons and relaxed open-swim sessions, plus yoga and zumba for all ages." },
  { slug: "thamarakulam", name: "Thamarakulam", blurb: "Residents of Thamarakulam choose Aqua Lagoon for its lifeguarded pool, small-batch coaching and flexible timings — swimming made safe and enjoyable for every age." },
  { slug: "cheppad", name: "Cheppad", blurb: "Families from Cheppad train at Aqua Lagoon with certified swim coaches, water-safety-focused lessons and open swims in a temperature-controlled pool." },
  { slug: "karuvatta", name: "Karuvatta", blurb: "Aqua Lagoon is a nearby swimming and wellness centre for Karuvatta — beginner-friendly lessons, open swims and group fitness classes led by experienced coaches." },
  { slug: "chengannur", name: "Chengannur", blurb: "Swimmers from Chengannur visit Aqua Lagoon for structured learn-to-swim batches, open swimming and wellness classes in a clean, safe and welcoming pool." },
];

export function findArea(slug: string): Area | undefined {
  return AREAS.find((a) => a.slug === slug);
}
