# Backend

Fastify 5 + Prisma 7 (TypeScript, ESM) API server for the Aqualagoon admin app.

## Stack

- **Fastify 5** — HTTP server, with `@fastify/helmet` (security headers) and `@fastify/cors`.
- **Prisma 7** — engine-free ORM. Connects via the `@prisma/adapter-pg` driver adapter; the generated client lives in `src/generated/prisma` (git-ignored, regenerated on build).
- **Zod 4** + **fastify-type-provider-zod** — schemas attached to each route drive request validation, response serialization, and the OpenAPI spec from a single source of truth.
- **@fastify/swagger** + **@fastify/swagger-ui** — interactive API docs at `/docs` (raw spec at `/docs/json`), generated from the Zod route schemas.
- **tsx** for dev, **tsc** for production builds.

## API docs

With the server running, open http://localhost:8000/docs for the Swagger UI. The spec is generated automatically from the Zod schemas on each route — no separate annotation step.

## File uploads (local or S3)

Profile photos go through a pluggable storage driver (`src/lib/storage/`):

- **Local (default):** files are written to `UPLOAD_DIR` and served by `@fastify/static` at `UPLOAD_URL_PREFIX`.
- **S3:** set `AWS_S3_BUCKET_NAME`, `AWS_S3_BUCKET_REGION`, `AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY` and uploads stream to the bucket via `@aws-sdk/lib-storage`. Because buckets are typically private, objects are served through **presigned URLs**: a stored `/api/files/<key>` path 302-redirects (via `GET /api/files/*`) to a short-lived presigned GET. Set `AWS_S3_PUBLIC_URL` to serve from a public CDN/base directly instead.

Keep real credentials in `.env` only (gitignored) — `.env.example` ships with placeholders.

## Setup

```bash
pnpm install
cp .env.example .env        # then set DATABASE_URL to a real Postgres instance
pnpm prisma:generate        # generate the client (also runs as part of build)
pnpm prisma:migrate         # create/apply the initial migration
pnpm dev                    # http://localhost:8000
```

No Postgres handy? `pnpm exec prisma dev` runs a local one.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run with hot reload (tsx watch). |
| `pnpm build` | Generate the Prisma client and compile to `dist/`. |
| `pnpm start` | Run the compiled server from `dist/`. |
| `pnpm typecheck` | Type-check without emitting. |
| `pnpm prisma:migrate` | Create and apply a dev migration. |
| `pnpm prisma:deploy` | Apply migrations in production. |
| `pnpm prisma:studio` | Open Prisma Studio. |

## Layout

```
prisma/
  schema.prisma     # models (datasource has no url — see prisma.config.ts)
prisma.config.ts    # Prisma 7 config: schema path, migrations, datasource url
src/
  server.ts         # entrypoint: boot + graceful shutdown
  app.ts            # buildApp(): plugins, error handler, routes
  config/env.ts     # Zod-validated environment (fail-fast at startup)
  plugins/prisma.ts # decorates app.prisma; disconnects on close
  routes/           # health + example status CRUD (mounted under /api)
  generated/prisma  # generated Prisma client (git-ignored)
```

## Prisma 7 notes

Prisma 7 removed `url` from the schema's `datasource` block. The connection
string is read from `DATABASE_URL` in two places: `prisma.config.ts` (for CLI
commands like migrate/studio) and the `PrismaPg` adapter in
`src/plugins/prisma.ts` (at runtime). Because the client is engine-free, a
driver adapter is **required** — there is no built-in connection without it.
