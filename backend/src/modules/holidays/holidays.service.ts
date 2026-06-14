import type { PrismaClient } from "../../generated/prisma/client.js";
import { Conflict, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { ActorContext } from "../users/users.service.js";
import type { CreateHolidayInput } from "./holidays.schema.js";

const MODULE = "holidays";

interface HolidayDto {
  id: string;
  date: string;
  name: string | null;
  createdAt: Date;
}

export class HolidaysService {
  constructor(private readonly prisma: PrismaClient) {}

  /** All holidays, soonest first. */
  async list(): Promise<HolidayDto[]> {
    const rows = await this.prisma.holiday.findMany({ orderBy: { date: "asc" } });
    return rows.map((h) => ({ id: h.id, date: h.date, name: h.name, createdAt: h.createdAt }));
  }

  async create(input: CreateHolidayInput, actor: ActorContext): Promise<HolidayDto> {
    const existing = await this.prisma.holiday.findUnique({ where: { date: input.date } });
    if (existing) throw Conflict("That date is already a holiday");

    const row = await this.prisma.holiday.create({
      data: { date: input.date, name: input.name ?? null, createdBy: actor.userId },
    });
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.COMPANY_UPDATE,
      module: MODULE,
      recordId: row.id,
      newData: { date: row.date, name: row.name },
      ipAddress: actor.ip,
    });
    return { id: row.id, date: row.date, name: row.name, createdAt: row.createdAt };
  }

  async remove(id: string, actor: ActorContext): Promise<void> {
    const existing = await this.prisma.holiday.findUnique({ where: { id } });
    if (!existing) throw NotFound("Holiday not found");
    await this.prisma.holiday.delete({ where: { id } });
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.COMPANY_UPDATE,
      module: MODULE,
      recordId: id,
      oldData: { date: existing.date, name: existing.name },
      ipAddress: actor.ip,
    });
  }
}
