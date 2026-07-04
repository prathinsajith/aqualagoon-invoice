# Aqua Lagoon — Marketing Website

The Aqua Lagoon marketing site (swimming pool, kids' water park & wellness centre),
built with **Next.js 16 (App Router) + React 19 + TypeScript** — matching the `frontend/`
admin app's stack.

## Stack

- **Next.js 16.2.9** App Router, **React 19.2.7**, **TypeScript** (strict)
- Plain **global CSS** design system (`app/globals.css`) driven by CSS custom properties —
  no Tailwind, no UI kit; the styles are ported 1:1 from the approved design prototype.
- **pnpm** package manager (own lockfile; not part of a workspace).
- Fonts: Fredoka + Nunito via Google Fonts.

## Structure

```
website/
├── app/
│   ├── layout.tsx        # Root layout: fonts, metadata, Header + Footer shell
│   ├── globals.css       # Full design system + responsive rules
│   ├── page.tsx          # Home (/)
│   ├── services/page.tsx # /services
│   ├── classes/page.tsx  # /classes  (timetable, pricing, FAQ)
│   ├── gallery/page.tsx  # /gallery
│   ├── about/page.tsx    # /about
│   └── contact/page.tsx  # /contact
├── components/
│   ├── Header.tsx        # "use client" — scroll-aware header, active route, mobile menu
│   ├── Footer.tsx
│   ├── Icon.tsx          # inline SVG icon set + <IconTile>
│   ├── Timetable.tsx     # shared weekly schedule table
│   ├── Testimonials.tsx  # "use client" — auto-rotating carousel
│   ├── Faq.tsx           # "use client" — accordion
│   ├── Gallery.tsx       # "use client" — category filter
│   └── ContactForm.tsx   # "use client" — validated form + success state
├── lib/
│   └── data.ts           # Typed single source of truth for all content
└── public/assets/        # Logo, hero photo, "why us" illustrations
```

Each nav item is a **real route** (`/services`, `/gallery`, …) with its own `<title>` and
meta description, so pages are deep-linkable, SEO-friendly and prerendered as static HTML.

## Editing content

All copy and lists live in [`lib/data.ts`](lib/data.ts) — `SERVICES`, `PRICING`,
`TIMETABLE`, `FAQS`, `TESTIMONIALS`, `GALLERY`, `CONTACT_INFO`, etc. Edit those typed
objects and every page updates. Brand colours, fonts, radii and shadows are CSS custom
properties under `:root` in [`app/globals.css`](app/globals.css).

## Develop

```bash
cd website
pnpm install          # first time — approves sharp/unrs-resolver native builds
pnpm dev              # http://localhost:4321
pnpm build            # production build (all routes static-prerendered)
pnpm start            # serve the production build on :4321
pnpm lint             # eslint (next/core-web-vitals + next/typescript)
```

> **First install note:** pnpm 11 blocks native post-install scripts by default. The
> allow-list lives in [`pnpm-workspace.yaml`](pnpm-workspace.yaml) (`sharp` for image
> optimization, `unrs-resolver` for eslint). If a fresh `pnpm install` reports ignored
> builds, run it once more so the approved scripts execute.

## Deploy

Deploys anywhere Next.js runs — **Vercel** is the natural fit (matches the admin app's host;
see the repo's `DEPLOYMENT.md`). Every route is static, so it can also be exported/served
behind any Node host.

## Backend integration (Gallery)

The **Gallery page pulls published images from the Aqua Lagoon backend** at build/ISR time
(Server Component, revalidated every 60s — see [`lib/gallery.ts`](lib/gallery.ts)). Images are
uploaded and managed by admins from the dashboard (**Settings → Website → Gallery**). If the
backend is unreachable or has no images, the page falls back to the bundled placeholder tiles,
so it always renders.

Set the backend origin via **`NEXT_PUBLIC_API_URL`** (defaults to `http://localhost:8800`):

```bash
# website/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8800     # prod: https://api.aqualagoon.com
```

The fetch runs server-side, so the API needs no CORS entry for the website origin, and the
public `GET /api/gallery` endpoint requires no auth.

## Notes / next steps

- The **contact form** is client-side only (shows a success state). Wire the `handleSubmit`
  in [`components/ContactForm.tsx`](components/ContactForm.tsx) to a real endpoint / the
  Aqua Lagoon backend to deliver enquiries.
- The **hero sub-strip avatar and a couple of section tiles** use gradient/illustration
  placeholders where real photography wasn't supplied. The gallery now uses real uploaded
  images (with placeholder fallback).
- **Social links** (`href="#"`) and the **map embed** are placeholders.
- Images use plain `<img>` from `/public/assets`; swap to `next/image` if you want the
  built-in optimizer once real photography is added.
