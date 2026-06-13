import type { FastifyRequest } from "fastify";
import type { AuditLogsService } from "./audit-logs.service.js";
import type { ListAuditLogsQuery } from "./audit-logs.types.js";

export function createAuditLogsController(service: AuditLogsService) {
  return {
    list: async (request: FastifyRequest<{ Querystring: ListAuditLogsQuery }>) => {
      return service.list(request.query);
    },
  };
}
