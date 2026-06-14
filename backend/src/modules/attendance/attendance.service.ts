import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta, toSkipTake } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { BadRequest, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { AuditActionType } from "../../lib/audit.js";
import type { ActorContext } from "../users/users.service.js";
import { attendanceInclude, toAttendanceDto } from "./attendance.types.js";
import type {
  AttendanceDto,
  AttendanceSummaryDto,
  BulkMarkAttendanceInput,
  ListAttendanceQuery,
  MarkAttendanceInput,
  UpdateAttendanceInput,
} from "./attendance.types.js";

const MODULE = "attendance";

type StatusKey = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";

/** Strips the time component so it lands cleanly in a `@db.Date` column. */
function toDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export class AttendanceService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(
    query: ListAttendanceQuery,
  ): Promise<{ data: AttendanceDto[]; meta: { pagination: PaginationMeta } }> {
    const where: Prisma.AttendanceWhereInput = {};
    if (query.batchId) where.batchId = query.batchId;
    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status;
    if (query.attendanceDate) {
      where.attendanceDate = toDateOnly(query.attendanceDate);
    } else if (query.dateFrom || query.dateTo) {
      where.attendanceDate = {
        ...(query.dateFrom ? { gte: toDateOnly(query.dateFrom) } : {}),
        ...(query.dateTo ? { lte: toDateOnly(query.dateTo) } : {}),
      };
    }

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: attendanceInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      this.prisma.attendance.count({ where }),
    ]);
    return {
      data: rows.map(toAttendanceDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  /** Marks one student's attendance, upserting on the student/batch/date key. */
  async mark(input: MarkAttendanceInput, actor: ActorContext): Promise<AttendanceDto> {
    await this.assertStudentExists(input.studentId);
    await this.assertBatchExists(input.batchId);

    const attendanceDate = toDateOnly(input.attendanceDate);
    const row = await this.prisma.attendance.upsert({
      where: {
        studentId_batchId_attendanceDate: {
          studentId: input.studentId,
          batchId: input.batchId,
          attendanceDate,
        },
      },
      create: {
        studentId: input.studentId,
        batchId: input.batchId,
        attendanceDate,
        status: input.status,
        checkIn: input.checkIn ?? null,
        checkOut: input.checkOut ?? null,
        markedBy: actor.userId,
      },
      update: {
        status: input.status,
        checkIn: input.checkIn ?? null,
        checkOut: input.checkOut ?? null,
        markedBy: actor.userId,
      },
      include: attendanceInclude,
    });

    const dto = toAttendanceDto(row);
    await this.audit(actor, AuditAction.ATTENDANCE_MARKED, dto.id, null, dto);
    return dto;
  }

  /** Marks an entire batch for a single date in one transaction. */
  async bulkMark(
    input: BulkMarkAttendanceInput,
    actor: ActorContext,
  ): Promise<{ marked: number }> {
    await this.assertBatchExists(input.batchId);

    const attendanceDate = toDateOnly(input.attendanceDate);
    await this.prisma.$transaction(
      input.records.map((record) =>
        this.prisma.attendance.upsert({
          where: {
            studentId_batchId_attendanceDate: {
              studentId: record.studentId,
              batchId: input.batchId,
              attendanceDate,
            },
          },
          create: {
            studentId: record.studentId,
            batchId: input.batchId,
            attendanceDate,
            status: record.status,
            checkIn: record.checkIn ?? null,
            checkOut: record.checkOut ?? null,
            markedBy: actor.userId,
          },
          update: {
            status: record.status,
            checkIn: record.checkIn ?? null,
            checkOut: record.checkOut ?? null,
            markedBy: actor.userId,
          },
        }),
      ),
    );

    await this.audit(actor, AuditAction.ATTENDANCE_MARKED, input.batchId, null, {
      batchId: input.batchId,
      attendanceDate,
      marked: input.records.length,
    });
    return { marked: input.records.length };
  }

  async update(
    id: string,
    input: UpdateAttendanceInput,
    actor: ActorContext,
  ): Promise<AttendanceDto> {
    const existing = await this.prisma.attendance.findUnique({
      where: { id },
      include: attendanceInclude,
    });
    if (!existing) throw NotFound("Attendance record not found");

    const updated = await this.prisma.attendance.update({
      where: { id },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.checkIn !== undefined ? { checkIn: input.checkIn ?? null } : {}),
        ...(input.checkOut !== undefined ? { checkOut: input.checkOut ?? null } : {}),
        markedBy: actor.userId,
      },
      include: attendanceInclude,
    });

    const before = toAttendanceDto(existing);
    const after = toAttendanceDto(updated);
    await this.audit(actor, AuditAction.ATTENDANCE_UPDATE, id, before, after);
    return after;
  }

  async summary(filters: {
    studentId?: string;
    batchId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<AttendanceSummaryDto> {
    const where: Prisma.AttendanceWhereInput = {};
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.batchId) where.batchId = filters.batchId;
    if (filters.dateFrom || filters.dateTo) {
      where.attendanceDate = {
        ...(filters.dateFrom ? { gte: toDateOnly(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: toDateOnly(filters.dateTo) } : {}),
      };
    }

    const grouped = await this.prisma.attendance.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });

    const counts: Record<StatusKey, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };
    for (const g of grouped) counts[g.status as StatusKey] = g._count._all;

    const total = counts.PRESENT + counts.ABSENT + counts.LATE + counts.LEAVE;
    const percentage =
      total === 0 ? 0 : Math.round(((counts.PRESENT + counts.LATE) / total) * 100);

    return {
      total,
      present: counts.PRESENT,
      absent: counts.ABSENT,
      late: counts.LATE,
      leave: counts.LEAVE,
      percentage,
    };
  }

  // --- helpers -------------------------------------------------------------

  private async assertStudentExists(studentId: string): Promise<void> {
    const student = await this.prisma.user.findFirst({
      where: { id: studentId, deletedAt: null },
      select: { id: true },
    });
    if (!student) throw BadRequest("Student not found");
  }

  private async assertBatchExists(batchId: string): Promise<void> {
    const batch = await this.prisma.trainingBatch.findUnique({
      where: { id: batchId },
      select: { id: true },
    });
    if (!batch) throw BadRequest("Batch not found");
  }

  private async audit(
    actor: ActorContext,
    action: AuditActionType,
    recordId: string,
    oldData: unknown,
    newData: unknown,
  ): Promise<void> {
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action,
      module: MODULE,
      recordId,
      oldData,
      newData,
      ipAddress: actor.ip,
    });
  }
}
