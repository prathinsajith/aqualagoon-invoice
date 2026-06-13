import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { toSkipTake } from "../../lib/pagination.js";
import { auditInclude } from "./audit-logs.types.js";
import type { AuditLogWithUser, ListAuditLogsQuery } from "./audit-logs.types.js";

export class AuditLogsRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(query: ListAuditLogsQuery): Promise<{ rows: AuditLogWithUser[]; total: number }> {
    const where: Prisma.AuditLogWhereInput = {};
    if (query.userId) where.userId = query.userId;
    if (query.module) where.module = query.module;
    if (query.action) where.action = query.action;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        ...(query.dateFrom ? { gte: query.dateFrom } : {}),
        ...(query.dateTo ? { lte: query.dateTo } : {}),
      };
    }
    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: "insensitive" } },
        { module: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await Promise.all([
      this.db.auditLog.findMany({
        where,
        include: auditInclude,
        orderBy: { createdAt: query.sortOrder },
        skip,
        take,
      }),
      this.db.auditLog.count({ where }),
    ]);

    return { rows, total };
  }
}
