import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

/**
 * Liveness and readiness probes. `/health` answers without touching the
 * database; `/health/db` confirms the connection is actually usable.
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/health",
    {
      schema: {
        tags: ["health"],
        summary: "Liveness probe",
        response: {
          200: z.object({ status: z.literal("ok"), uptime: z.number() }),
        },
      },
    },
    async () => ({ status: "ok" as const, uptime: process.uptime() }),
  );

  r.get(
    "/health/db",
    {
      schema: {
        tags: ["health"],
        summary: "Readiness probe (database connectivity)",
        response: {
          200: z.object({ status: z.literal("ok"), database: z.literal("reachable") }),
          503: z.object({ status: z.literal("error"), database: z.literal("unreachable") }),
        },
      },
    },
    async (_request, reply) => {
      try {
        await app.prisma.$queryRaw`SELECT 1`;
        return { status: "ok" as const, database: "reachable" as const };
      } catch (error) {
        app.log.error(error, "Database health check failed");
        return reply
          .status(503)
          .send({ status: "error" as const, database: "unreachable" as const });
      }
    },
  );
}
