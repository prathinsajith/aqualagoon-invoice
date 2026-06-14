import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta, toSkipTake } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { BadRequest, Conflict, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { AuditActionType } from "../../lib/audit.js";
import type { ActorContext } from "../users/users.service.js";
import { enrollmentInclude, toEnrollmentDto } from "./enrollments.types.js";
import type {
  CreateEnrollmentInput,
  EnrollmentDto,
  ListEnrollmentsQuery,
  UpdateEnrollmentInput,
} from "./enrollments.types.js";

const MODULE = "enrollments";

export class EnrollmentsService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Days a student has consumed = attendance marked PRESENT or LATE in the batch. */
  private async countAttended(studentId: string, batchId: string): Promise<number> {
    return this.prisma.attendance.count({
      where: { studentId, batchId, status: { in: ["PRESENT", "LATE"] } },
    });
  }

  /**
   * Attended-day counts for a page of enrollments in a single grouped query,
   * keyed by `studentId|batchId`. Avoids an N+1 across the list.
   */
  private async attendedMap(
    rows: { studentId: string; batchId: string }[],
  ): Promise<Map<string, number>> {
    const pairs = [
      ...new Map(
        rows.map((r) => [`${r.studentId}|${r.batchId}`, { studentId: r.studentId, batchId: r.batchId }]),
      ).values(),
    ];
    if (pairs.length === 0) return new Map();
    const grouped = await this.prisma.attendance.groupBy({
      by: ["studentId", "batchId"],
      where: { status: { in: ["PRESENT", "LATE"] }, OR: pairs },
      _count: { _all: true },
    });
    return new Map(grouped.map((g) => [`${g.studentId}|${g.batchId}`, g._count._all]));
  }

  async list(
    query: ListEnrollmentsQuery,
  ): Promise<{ data: EnrollmentDto[]; meta: { pagination: PaginationMeta } }> {
    const where: Prisma.StudentEnrollmentWhereInput = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.batchId) where.batchId = query.batchId;
    if (query.status) where.status = query.status;
    if (query.feePlanId) where.feePlanId = query.feePlanId;
    if (query.search) {
      where.student = {
        OR: [
          { firstName: { contains: query.search, mode: "insensitive" } },
          { lastName: { contains: query.search, mode: "insensitive" } },
        ],
      };
    }

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await Promise.all([
      this.prisma.studentEnrollment.findMany({
        where,
        include: enrollmentInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      this.prisma.studentEnrollment.count({ where }),
    ]);
    const attended = await this.attendedMap(rows);
    return {
      data: rows.map((r) => toEnrollmentDto(r, attended.get(`${r.studentId}|${r.batchId}`) ?? 0)),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async getById(id: string): Promise<EnrollmentDto> {
    const enrollment = await this.prisma.studentEnrollment.findUnique({
      where: { id },
      include: enrollmentInclude,
    });
    if (!enrollment) throw NotFound("Enrollment not found");
    return toEnrollmentDto(enrollment, await this.countAttended(enrollment.studentId, enrollment.batchId));
  }

  async create(input: CreateEnrollmentInput, actor: ActorContext): Promise<EnrollmentDto> {
    const created = await this.prisma.$transaction(async (tx) => {
      const student = await tx.user.findUnique({ where: { id: input.studentId } });
      if (!student || student.deletedAt) throw BadRequest("Student not found");

      const batch = await tx.trainingBatch.findUnique({ where: { id: input.batchId } });
      if (!batch) throw BadRequest("Batch not found");
      if (batch.status !== "ACTIVE") throw BadRequest("Batch is not active");

      const duplicate = await tx.studentEnrollment.findFirst({
        where: { studentId: input.studentId, batchId: input.batchId, status: "ACTIVE" },
      });
      if (duplicate) throw Conflict("Student is already enrolled in this batch");

      if (batch.capacity > 0 && batch.currentStrength >= batch.capacity) {
        throw Conflict("Batch is full");
      }

      if (input.feePlanId) {
        const feePlan = await tx.feePlan.findUnique({ where: { id: input.feePlanId } });
        if (
          !feePlan ||
          feePlan.deletedAt ||
          feePlan.trainingProgramId !== batch.trainingProgramId
        ) {
          throw BadRequest("Fee plan does not belong to this batch's program");
        }
      }

      const row = await tx.studentEnrollment.create({
        data: {
          studentId: input.studentId,
          batchId: input.batchId,
          feePlanId: input.feePlanId ?? null,
          status: "ACTIVE",
          createdBy: actor.userId,
        },
        include: enrollmentInclude,
      });
      await tx.trainingBatch.update({
        where: { id: input.batchId },
        data: { currentStrength: { increment: 1 } },
      });
      return row;
    });

    const dto = toEnrollmentDto(created);
    await this.audit(actor, AuditAction.STUDENT_ENROLLED, dto.id, null, dto);
    return dto;
  }

  async update(
    id: string,
    input: UpdateEnrollmentInput,
    actor: ActorContext,
  ): Promise<EnrollmentDto> {
    const { before, after, newStatus } = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.studentEnrollment.findUnique({
        where: { id },
        include: enrollmentInclude,
      });
      if (!existing) throw NotFound("Enrollment not found");

      const nextStatus = input.status ?? existing.status;
      const wasActive = existing.status === "ACTIVE";
      const willBeActive = nextStatus === "ACTIVE";

      if (input.feePlanId) {
        const feePlan = await tx.feePlan.findUnique({ where: { id: input.feePlanId } });
        if (
          !feePlan ||
          feePlan.deletedAt ||
          feePlan.trainingProgramId !== existing.batch.program.id
        ) {
          throw BadRequest("Fee plan does not belong to this batch's program");
        }
      }

      if (wasActive && !willBeActive) {
        // Leaving the active roster — free a seat (never below zero).
        await tx.trainingBatch.update({
          where: { id: existing.batchId },
          data: { currentStrength: { decrement: 1 } },
        });
        await tx.trainingBatch.updateMany({
          where: { id: existing.batchId, currentStrength: { lt: 0 } },
          data: { currentStrength: 0 },
        });
      } else if (!wasActive && willBeActive) {
        // Re-activating — re-check the duplicate-active guard and capacity.
        const duplicate = await tx.studentEnrollment.findFirst({
          where: {
            studentId: existing.studentId,
            batchId: existing.batchId,
            status: "ACTIVE",
            id: { not: id },
          },
        });
        if (duplicate) throw Conflict("Student is already enrolled in this batch");

        const batch = await tx.trainingBatch.findUnique({ where: { id: existing.batchId } });
        if (batch && batch.capacity > 0 && batch.currentStrength >= batch.capacity) {
          throw Conflict("Batch is full");
        }
        await tx.trainingBatch.update({
          where: { id: existing.batchId },
          data: { currentStrength: { increment: 1 } },
        });
      }

      const updated = await tx.studentEnrollment.update({
        where: { id },
        data: {
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.feePlanId !== undefined ? { feePlanId: input.feePlanId } : {}),
        },
        include: enrollmentInclude,
      });

      return {
        before: toEnrollmentDto(existing),
        after: toEnrollmentDto(updated),
        newStatus: nextStatus,
      };
    });

    const action = newStatus === "DROPPED" ? AuditAction.STUDENT_REMOVED : AuditAction.ENROLLMENT_UPDATE;
    await this.audit(actor, action, id, before, after);
    return after;
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
