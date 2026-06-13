# Aqualagoon Admin

A full-stack admin dashboard. The repo holds two independent projects:

| Folder | What it is | Runs on |
| --- | --- | --- |
| [`frontend/`](./frontend) | "Smart Tracking" admin UI — Next.js 16 + React 19 | http://localhost:3000 |
| [`backend/`](./backend) | REST API — Fastify 5 + Prisma 7 (PostgreSQL) | http://localhost:8000 |

Each project is self-contained: its own `package.json`, `node_modules`, and lockfile. There is **no root-level workspace** — install and run them separately.

## Prerequisites

- **Node.js** 20.19+ / 22.12+ / 24+ (the project was developed on Node 25; Prisma prints a warning on odd/non-LTS versions but works).
- **pnpm** 11+ — the package manager for both projects (`npm i -g pnpm`).
- **PostgreSQL** — for the backend. Use any local/hosted instance, or `cd backend && pnpm exec prisma dev` to run a throwaway local one.

---

## Running the project

Open two terminals — one per project.

### 1. Backend (`cd backend`)

```bash
pnpm install                 # install dependencies
cp .env.example .env         # then edit .env and set a real DATABASE_URL
pnpm prisma:generate         # generate the Prisma client
pnpm prisma:migrate          # create + apply the initial DB migration
pnpm dev                     # start with hot reload -> http://localhost:8000
```

Quick check: `curl http://localhost:8000/health` → `{"status":"ok",...}`.

### 2. Frontend (`cd frontend`)

```bash
pnpm install
# .env.local should contain: NEXT_PUBLIC_API_URL=http://localhost:8000
pnpm dev                     # -> http://localhost:3000
```

The frontend talks to the backend via `NEXT_PUBLIC_API_URL`. CORS on the backend is pre-configured to allow `http://localhost:3000` (change `CORS_ORIGIN` in `backend/.env` for other origins).

### Scripts reference

**Backend** (`backend/package.json`):

| Script | Does |
| --- | --- |
| `pnpm dev` | Run with hot reload (`tsx watch`). |
| `pnpm build` | `prisma generate` then `tsc` → `dist/`. |
| `pnpm start` | Run the compiled server (`node dist/server.js`). |
| `pnpm typecheck` | Type-check only (`tsc --noEmit`). |
| `pnpm prisma:migrate` | Create + apply a dev migration. |
| `pnpm prisma:deploy` | Apply migrations in production. |
| `pnpm prisma:studio` | Open Prisma Studio (DB GUI). |
| `pnpm db:push` | Push schema to the DB without a migration. |

**Frontend** (`frontend/package.json`):

| Script | Does |
| --- | --- |
| `pnpm dev` | Next.js dev server. |
| `pnpm build` | Production build. |
| `pnpm start` | Serve the production build. |
| `pnpm lint` | Run ESLint. |

---

## Environment variables

### Backend (`backend/.env`, see `.env.example`)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | — | PostgreSQL connection string (Prisma CLI + runtime adapter). |
| `PORT` | no | `8000` | HTTP port. |
| `HOST` | no | `0.0.0.0` | Bind address. |
| `NODE_ENV` | no | `development` | `development` \| `production` \| `test`. |
| `LOG_LEVEL` | no | `info` | Pino log level. |
| `CORS_ORIGIN` | no | `http://localhost:3000` | Comma-separated allowed origins. |

Validated at startup by `src/config/env.ts` (Zod) — the server exits with a clear message if anything is missing or invalid.

### Frontend (`frontend/.env.local`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes (prod) | Base URL of the backend API. Falls back to `http://localhost:8000` in dev. |

---

## Packages used

### Frontend (Next.js 16 / React 19)

**Framework & language**
- `next` 16.2.9 — App Router framework.
- `react` / `react-dom` 19.2.7.
- `typescript` 6 (strict mode).

**UI & styling**
- `tailwindcss` 4.3 + `@tailwindcss/postcss`, `tw-animate-css` — utility-first CSS (v4, config-less).
- Radix UI primitives (`@radix-ui/react-*`: avatar, checkbox, dialog, dropdown-menu, label, popover, select, separator, slot, tabs, toggle, toggle-group, tooltip) — the headless base for shadcn/ui components.
- `lucide-react` 1.x & `@tabler/icons-react` — icon sets.
- `class-variance-authority`, `clsx`, `tailwind-merge` — class composition helpers.
- `next-themes` — light/dark theming.
- `sonner` — toast notifications.
- `vaul` — drawer component.

**Data, forms & state**
- `axios` 1.17 — HTTP client (configured with auth interceptors in `lib/axios.ts`).
- `zustand` 5 — global client state (auth store).
- `react-hook-form` + `@hookform/resolvers` + `zod` 4 — forms & validation.
- `@tanstack/react-table` 8 — data tables.

**Feature libraries**
- `@fullcalendar/*` 6 — calendar views (daygrid, timegrid, list, interaction).
- `@dnd-kit/*` — drag-and-drop.
- `recharts` 3 — charts.
- `mitt` — tiny event emitter.

**Tooling (dev)**
- `eslint` **9.39.4** (pinned — see note below) + `eslint-config-next`.
- `@types/*` for Node/React.

> **Note:** ESLint is intentionally pinned to 9.x. ESLint 10 currently crashes Next's lint config because `eslint-config-next` bundles a version of `eslint-plugin-react` that isn't compatible with ESLint 10 yet.

### Backend (Fastify 5 / Prisma 7)

**Server**
- `fastify` 5.8 — HTTP framework.
- `@fastify/cors` — CORS handling.
- `@fastify/helmet` — security headers.
- `fastify-plugin` — for writing encapsulation-safe plugins (Prisma decorator).
- `fastify-type-provider-zod` — drives request validation + response serialization from the route Zod schemas.
- `@fastify/swagger` + `@fastify/swagger-ui` — auto-generated OpenAPI docs at `/docs`.

**Database**
- `prisma` 7 (CLI) + `@prisma/client` 7 — engine-free ORM.
- `@prisma/adapter-pg` 7 — PostgreSQL driver adapter (**required** in Prisma 7 — the client has no built-in connection).

**Language & validation**
- `typescript` 6 (ESM, `nodenext`).
- `zod` 4 — env + request validation.
- `dotenv` — loads `.env` for the Prisma config and runtime.

**Tooling (dev)**
- `tsx` — run/watch TypeScript directly in dev.
- `pino-pretty` — human-readable logs in development.

> **Prisma 7 notes:** the `datasource` block has no `url` (removed in v7) — the connection string is supplied via `DATABASE_URL` in both `prisma.config.ts` (CLI) and the `PrismaPg` adapter (runtime). The generated client lands in `backend/src/generated/prisma/` (git-ignored) and is regenerated by `pnpm prisma:generate` / `pnpm build`.

---

## Project-specific docs

- [`backend/README.md`](./backend/README.md) — backend layout and Prisma 7 details.
- `CLAUDE.md` — architecture notes (auth flow, conventions) for working in the codebase.
