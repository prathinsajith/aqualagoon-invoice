# Deployment

Frontend + website → **Vercel** (two separate Vercel projects), backend → **Railway**,
Postgres → **Railway plugin**. All projects run on **Node 24 LTS** (`.nvmrc` +
`engines >=24`). The repo is not a real monorepo — each project deploys independently
with its own root directory.

---

## Backend (Railway)

**Root Directory:** `backend`

| Setting | Value |
|---|---|
| Build command | `pnpm build` (`prisma generate && tsc`) |
| Start command | `pnpm start:migrate` (runs `prisma migrate deploy` then `node dist/server.js`) |
| Health check path | `/health` (liveness, no DB) — or `/health/db` for readiness |

### Required environment variables

| Var | Notes |
|---|---|
| `DATABASE_URL` | From the Railway Postgres plugin. |
| `JWT_ACCESS_SECRET` | ≥32 chars. `openssl rand -base64 48`. |
| `JWT_REFRESH_SECRET` | ≥32 chars, **distinct** from the access secret. |
| `CORS_ORIGIN` | The Vercel frontend URL(s), comma-separated. No trailing slash. |
| `FRONTEND_URL` | Vercel URL — used to build links in emails. |
| `NODE_ENV` | `production` |

Do **not** set `PORT`/`HOST` — Railway injects `PORT`, and `HOST` defaults to `0.0.0.0`.

### Strongly recommended for production

- **S3 uploads** — Railway's filesystem is ephemeral; local uploads are lost on every
  redeploy/restart. Set all four to switch to durable S3 storage:
  `AWS_S3_BUCKET_NAME`, `AWS_S3_BUCKET_REGION`, `AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY`
  (optional `AWS_S3_PUBLIC_URL` for a CDN). The server logs a warning at boot if it's on local disk in prod.
- **Email** — without it, password-reset/notification emails silently no-op. Set `SMTP_*`
  (or `EMAIL_PROVIDER=gmail|resend`) **and** `EMAIL_DEV_FALLBACK=false`. The server warns at boot if unset in prod.

### First deploy — seed the database

After the first successful deploy (migrations applied), seed the permission catalog,
system roles, and the first admin. Run once from the Railway shell / a one-off command:

```bash
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='<strong-password>' pnpm db:seed
```

The seeder is idempotent. Do **not** set `SEED_SAMPLES=true` in production (that adds demo
catalog data + a demo trainer with a known password).

---

## Frontend (Vercel)

**Root Directory:** `frontend` · Framework preset: Next.js

### Install command (required override)

`pnpm-workspace.yaml` enables supply-chain hardening (`minimumReleaseAge`, `trustPolicy`)
for local development. Those checks reject freshly-published pinned deps (and false-positive
on old transitive deps like `semver@6.3.1`) on a frozen-lockfile CI install. Override them at
deploy time only — the committed lockfile is the source of trust:

```
pnpm install --frozen-lockfile --config.minimumReleaseAge=0 --config.trustPolicy=none
```

Build command stays the default `pnpm build` (`next build`).

### Required environment variables

| Var | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | The Railway backend URL, no trailing slash. **Baked in at build time** — set it in Vercel → Settings → Environment Variables (Production), then redeploy **without** build cache. The app throws on startup in prod if it's missing. |

---

## Website (Vercel — second project)

**Root Directory:** `website` · Framework preset: Next.js

The public marketing site deploys as its **own Vercel project** pointing at the same
repo with a different root directory. Its `website/vercel.json` pins the framework,
install command (same supply-chain override as the frontend), and build command —
no dashboard overrides needed.

### Required environment variables

| Var | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | The Railway backend URL, no trailing slash. All site content (CMS sections, gallery, enquiries proxy) is fetched from here. |
| `NEXT_PUBLIC_SITE_URL` | The website's own public URL (custom domain if set) — used for canonical URLs, `sitemap.xml`, `robots.txt`, and Open Graph tags. |

Both are `NEXT_PUBLIC_*` and therefore **baked in at build time** — after changing
them, redeploy without build cache.

No backend CORS change is needed for the website: content is fetched server-side and
the contact form posts through the same-origin `/api/enquiries` route handler, which
proxies to the backend from the server.

### After deploy

Set `NEXT_PUBLIC_WEBSITE_URL` on the **frontend (admin)** Vercel project to the
website's URL so the admin's "View live site" link points at production.

---

## Notes & gotchas

- **`packages:` field** — each `pnpm-workspace.yaml` lists `packages: [.]`. Without it, newer
  pnpm aborts install with `packages field missing or empty`. Keep it.
- **`trustProxy`** is on (`src/app.ts`) so `request.ip` reflects the real client behind
  Railway's proxy — required for the per-IP login rate limit and accurate audit-log IPs.
- **Refresh-token cookie** is HTTP-only + `Secure` in production + `SameSite=Lax`, set by the
  same-origin Next route handlers under `app/api/auth/*`. No cross-site cookie is needed.
- **Node version** — confirm Vercel and Railway both offer Node 24 in their runtime selector
  (both LTS-current). If a platform caps at 22, change `engines.node` to `>=22` (also LTS).
- Apply DB schema changes with `prisma migrate deploy` (handled by `pnpm start:migrate`),
  never `migrate dev`, in production.
