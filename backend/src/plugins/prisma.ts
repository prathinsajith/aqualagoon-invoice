import fp from "fastify-plugin";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

/**
 * Creates a single PrismaClient for the app lifetime and exposes it as
 * `app.prisma`. Prisma 7 is engine-free, so the connection is supplied through
 * the node-postgres driver adapter rather than a `url` in the schema.
 */
export default fp(
  async (app) => {
    const adapter = new PrismaPg({
      connectionString: env.DATABASE_URL,
      // Bounded connection pool (node-postgres). One app instance sized to stay
      // well under Postgres `max_connections`; `connectionTimeoutMillis` fails
      // fast instead of hanging a request when the pool is saturated, and idle
      // connections are recycled. Raise `max` only if you scale to more
      // instances and the database can take it.
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    // Connects lazily on first query, so the server can boot before the
    // database is reachable. Use the `/health/db` probe to verify connectivity.
    const prisma = new PrismaClient({ adapter });

    app.decorate("prisma", prisma);

    app.addHook("onClose", async (instance) => {
      await instance.prisma.$disconnect();
    });
  },
  { name: "prisma" },
);
