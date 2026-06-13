import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type { auditLogSchema, listAuditLogsQuery } from "./audit-logs.schema.js";

export type AuditLogDto = z.infer<typeof auditLogSchema>;
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuery>;

export const auditInclude = {
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.AuditLogInclude;

export type AuditLogWithUser = Prisma.AuditLogGetPayload<{ include: typeof auditInclude }>;

export function toAuditLogDto(row: AuditLogWithUser): AuditLogDto {
  return {
    id: row.id,
    userId: row.userId,
    action: row.action,
    module: row.module,
    recordId: row.recordId,
    oldData: row.oldData ?? null,
    newData: row.newData ?? null,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
    user: row.user,
  };
}
