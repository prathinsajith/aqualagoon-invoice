import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { commonErrors, paginatedResponse } from "../../lib/response.js";
import { AuditLogsService } from "./audit-logs.service.js";
import { createAuditLogsController } from "./audit-logs.controller.js";
import { auditLogSchema, listAuditLogsQuery } from "./audit-logs.schema.js";

export async function auditLogsRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createAuditLogsController(new AuditLogsService(app.prisma));

  r.get(
    "/audit-logs",
    {
      preHandler: [app.authenticate, app.requirePermission("audit.view")],
      schema: {
        tags: ["audit-logs"],
        summary: "List audit-log entries (paginated, filterable)",
        security: [{ bearerAuth: [] }],
        querystring: listAuditLogsQuery,
        response: { 200: paginatedResponse(auditLogSchema), ...commonErrors },
      },
    },
    controller.list,
  );
}
