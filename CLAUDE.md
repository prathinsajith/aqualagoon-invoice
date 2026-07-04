# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo has two top-level directories, each its own self-contained project with its own `package.json`, `node_modules`, and pnpm store:

- `frontend/` — the "Smart Tracking" admin dashboard: Next.js 16 (App Router) + React 19. The git repository is rooted **here**, not at the repo top level.
- `backend/` — a Fastify 5 + Prisma 7 (TypeScript, ESM) API server. See `backend/README.md` for details.

**`cd` into the relevant project before running commands** — there is no root-level workspace tying them together. The sections below are split by project.

## Commands

Package manager is **pnpm** throughout. Each project has its own lockfile and `pnpm-workspace.yaml` (used only to allow-list native build scripts like Prisma engines, sharp, esbuild — not a real pnpm workspace).

Frontend (`cd frontend`):

```bash
pnpm dev      # dev server at http://localhost:3000
pnpm build    # production build
pnpm start    # serve the production build
pnpm lint     # eslint (next/core-web-vitals + next/typescript)
```

Backend (`cd backend`):

```bash
pnpm dev              # tsx watch, http://localhost:8000
pnpm build            # prisma generate + tsc -> dist/
pnpm start            # run dist/server.js
pnpm typecheck        # tsc --noEmit
pnpm prisma:migrate   # create/apply a dev migration
pnpm prisma:studio    # open Prisma Studio
```

Neither project has a test setup. ESLint on the frontend is pinned to 9.x — ESLint 10 crashes because `eslint-config-next`'s bundled `eslint-plugin-react` isn't yet compatible with it.

## Frontend environment

`NEXT_PUBLIC_API_URL` is required — it's the base URL of the external backend API. In production, `lib/env.ts` throws on startup if it's missing; in development it falls back to `http://localhost:8000` with a warning. Import config via the validated `env` object from `@/lib/env` rather than reading `process.env` directly. Local values live in `.env.local` (gitignored).

The `@/*` import alias maps to the `frontend/` root (see `tsconfig.json`). TypeScript is in `strict` mode.

## Authentication architecture

This is the most important system to understand before touching auth, data fetching, or routing. It uses a **split-token** scheme:

- **Access token**: short-lived, held only in memory in the Zustand store (`stores/auth-store.ts`). Never persisted. Lost on refresh and re-acquired (see below).
- **Refresh token**: long-lived, stored as an **HTTP-only cookie** that JS cannot read. It is managed exclusively by Next.js Route Handlers under `app/api/auth/`, which act as a thin proxy in front of the backend so the cookie stays server-side.

Flow:
1. **Login** (`components/login-form.tsx`): POSTs credentials to the backend `/api/login`, stores the access token in memory, then POSTs the refresh token to `/api/auth/store-refresh` to set the HTTP-only cookie. Finally fetches the user via `/api/user/me`.
2. **App load** (`hooks/useInitializeAuth.ts`, called once in `app/(root)/client-layout.tsx`): since the access token is gone after any page reload, this calls `/api/auth/refresh` (which reads the cookie and hits the backend `/api/token/refresh`) to mint a new access token, then re-fetches the user.
3. **Route protection** (`proxy.ts`): redirects to `/login` if the `refresh_token` cookie is absent. (Next.js 16 renamed the `middleware` file convention to `proxy` — the file is `frontend/proxy.ts` and exports a `proxy` function.) The matcher covers `/dashboard`, `/settings`, `/profile`, `/users`, `/products`, `/product-categories`, `/audit-logs`, etc. **When adding a new protected top-level route, add it to the proxy matcher** or it will be publicly accessible.
4. **Auto-refresh on 401** (`lib/axios.ts`): the shared axios instance attaches the in-memory access token to every request and, on a 401, refreshes the token once and retries — with a queue so concurrent 401s don't trigger multiple refreshes. On refresh failure it calls `logout()`.
5. **Logout** (`stores/auth-store.ts` → `/api/auth/logout`): clears the in-memory state and deletes the refresh cookie, then hard-redirects to `/login`.

Consequence: **all calls to the backend API must go through the `api` axios instance from `@/lib/axios`** (not bare `fetch`/`axios`) so they get the token, auto-refresh, and `baseURL`. Calls to the Next.js route handlers (`/api/auth/*`) use plain `fetch` with `credentials: "include"` because those are same-origin and cookie-based.

## App structure & conventions

- **Route groups**: `app/(auth)/` holds unauthenticated pages (e.g. `login`); `app/(root)/` holds the authenticated app and wraps everything in `client-layout.tsx` (sidebar + header + footer + auth init). `app/page.tsx` redirects `/` → `/dashboard`.
- **Service layer**: API endpoints are wrapped in service modules under `services/` (e.g. `StatusService` in `status-service.ts`) exposing typed CRUD methods. Add new backend integrations here rather than calling `api` directly from components. Note the backend uses some non-RESTful conventions (e.g. list fetch is `PUT /api/status/get-all-status-list` with `{page, limit}`).
- **Data tables**: list pages use `components/data-table-generic.tsx` with TanStack Table. Server-side pagination is driven by passing `manualPagination`, `pageCount`, and a `PaginationState` (see `app/(root)/status/page.tsx` + `columns.tsx` for the canonical pattern). Each list route defines its own `columns.tsx`.
- **State**: global client state is Zustand (`stores/`). Forms use `react-hook-form` + `zod` resolvers, with schemas in `schemas/`. Toasts via `sonner` (`<Toaster>` mounted in `app/layout.tsx`).
- **UI**: shadcn/ui components (new-york style, `components/ui/`) + Tailwind CSS v4 (config-less, `app/globals.css`). Icons come from both `lucide-react` and `@tabler/icons-react`. Theming via `next-themes` (`components/theme-provider.tsx`); a top-level `ErrorBoundary` wraps the app.
- **Navigation** is data-driven from `NAVBAR_DATA` in `lib/constant.ts` (icons referenced by string name) — add sidebar entries there.

## Backend architecture

The backend (`backend/`) is a Fastify 5 + Prisma 7 ESM server. `src/server.ts` is the entrypoint (boot + graceful shutdown); `src/app.ts` exposes `buildApp()` which registers plugins (helmet, CORS, Prisma), a shared Zod-aware error handler, and route modules. Routes live in `src/routes/` and are mounted under `/api` (except health checks). Environment is validated once at startup in `src/config/env.ts` (fail-fast via Zod).

**Prisma 7 specifics** (this version changed significantly, so don't assume Prisma 5/6 conventions):
- The `datasource` block in `prisma/schema.prisma` has **no `url`** — it was removed in Prisma 7. The connection string lives in `DATABASE_URL` and is wired in two places: `prisma.config.ts` (for CLI: migrate, studio) and the `PrismaPg` adapter in `src/plugins/prisma.ts` (runtime).
- The client is **engine-free** and **requires a driver adapter** (`@prisma/adapter-pg`); there is no connection without it.
- The generated client lands in `src/generated/prisma/` (git-ignored) and imports its own files with `.ts` specifiers, which is why `tsconfig.json` sets `allowImportingTsExtensions` + `rewriteRelativeImportExtensions`. Run `pnpm prisma:generate` after schema changes (also part of `pnpm build`).
- Access the client via `app.prisma` inside route handlers (decorated by the Prisma plugin), not by importing a singleton.
