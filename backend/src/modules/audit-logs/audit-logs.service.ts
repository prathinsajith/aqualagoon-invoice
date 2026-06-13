import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { AuditLogsRepository } from "./audit-logs.repository.js";
import { toAuditLogDto } from "./audit-logs.types.js";
import type { AuditLogDto, ListAuditLogsQuery } from "./audit-logs.types.js";

export class AuditLogsService {
  private readonly repo: AuditLogsRepository;

  constructor(prisma: PrismaClient) {
    this.repo = new AuditLogsRepository(prisma);
  }

  async list(
    query: ListAuditLogsQuery,
  ): Promise<{ data: AuditLogDto[]; meta: { pagination: PaginationMeta } }> {
    const { rows, total } = await this.repo.list(query);
    return {
      data: rows.map(toAuditLogDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }
}
