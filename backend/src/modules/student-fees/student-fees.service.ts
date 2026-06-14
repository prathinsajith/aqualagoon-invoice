import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta, toSkipTake } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { BadRequest, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { ActorContext } from "../users/users.service.js";
import { StudentFeesRepository } from "./student-fees.repository.js";
import { toStudentFeeDto } from "./student-fees.types.js";
import type {
  CreateStudentFeeInput,
  FeeHistoryRow,
  FeeLedgerQuery,
  FeeLedgerRow,
  ListStudentFeesQuery,
  StudentFeeDto,
} from "./student-fees.types.js";

const MODULE = "student-fees";

const D = Prisma.Decimal;

export class StudentFeesService {
  private readonly repo: StudentFeesRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new StudentFeesRepository(prisma);
  }

  async list(
    query: ListStudentFeesQuery,
  ): Promise<{ data: StudentFeeDto[]; meta: { pagination: PaginationMeta } }> {
    const { rows, total } = await this.repo.list(query);
    return {
      data: rows.map(toStudentFeeDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async getById(id: string): Promise<StudentFeeDto> {
    const fee = await this.repo.findById(id);
    if (!fee) throw NotFound("Student fee not found");
    return toStudentFeeDto(fee);
  }

  /**
   * Per-student fee ledger: one row per enrollment with billed / paid / balance
   * rolled up from its fees, plus a status. Lets the desk see, at a glance, who
   * has paid and who still owes.
   */
  async ledger(
    query: FeeLedgerQuery,
  ): Promise<{ data: FeeLedgerRow[]; meta: { pagination: PaginationMeta } }> {
    const where: Prisma.StudentEnrollmentWhereInput = {};
    if (query.batchId) where.batchId = query.batchId;
    if (query.search) {
      where.student = {
        OR: [
          { firstName: { contains: query.search, mode: "insensitive" } },
          { lastName: { contains: query.search, mode: "insensitive" } },
        ],
      };
    }

    const { skip, take } = toSkipTake(query.page, query.limit);
    const sortKey = query.sortBy === "joinedDate" ? "joinedDate" : "createdAt";
    const [rows, total] = await Promise.all([
      this.prisma.studentEnrollment.findMany({
        where,
        include: {
          student: { select: { firstName: true, lastName: true } },
          batch: { select: { name: true, program: { select: { name: true } } } },
          studentFees: { select: { finalAmount: true, paidAmount: true, status: true } },
        },
        orderBy: { [sortKey]: query.sortOrder },
        skip,
        take,
      }),
      this.prisma.studentEnrollment.count({ where }),
    ]);

    const ledger: FeeLedgerRow[] = rows.map((e) => {
      let billed = new D(0);
      let paid = new D(0);
      let hasOverdue = false;
      for (const f of e.studentFees) {
        billed = billed.add(f.finalAmount);
        paid = paid.add(f.paidAmount);
        if (f.status === "OVERDUE") hasOverdue = true;
      }
      const balance = billed.sub(paid);
      const billedN = billed.toNumber();
      const paidN = paid.toNumber();
      const balanceN = balance.toNumber();
      const status: FeeLedgerRow["status"] =
        e.studentFees.length === 0
          ? "NO_FEE"
          : balanceN <= 0
            ? "PAID"
            : hasOverdue
              ? "OVERDUE"
              : paidN > 0
                ? "PARTIAL"
                : "PENDING";
      return {
        enrollmentId: e.id,
        studentId: e.studentId,
        studentName: `${e.student.firstName} ${e.student.lastName}`.trim(),
        programName: e.batch.program.name,
        batchName: e.batch.name,
        feeCount: e.studentFees.length,
        billed: billedN,
        paid: paidN,
        balance: balanceN,
        status,
      };
    });

    // Status is computed, so filter after the roll-up (keeps the query simple).
    const filtered = query.status ? ledger.filter((r) => r.status === query.status) : ledger;

    return {
      data: filtered,
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  /**
   * Payment history for one enrollment: every payment received against any of
   * its training fees, newest first. Each fee payment is its own invoice, so we
   * resolve the enrollment's fees → the invoices that charged them → their
   * payments. Lets the desk see exactly when and how a student paid.
   */
  async paymentHistory(enrollmentId: string): Promise<FeeHistoryRow[]> {
    const fees = await this.prisma.studentFee.findMany({
      where: { enrollmentId },
      select: { id: true },
    });
    if (fees.length === 0) return [];
    const feeIds = fees.map((f) => f.id);

    const items = await this.prisma.invoiceItem.findMany({
      where: { itemType: "TRAINING", itemId: { in: feeIds } },
      select: {
        itemId: true,
        itemName: true,
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            status: true,
            payments: {
              select: {
                amount: true,
                paymentDate: true,
                paymentMethod: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const rows: FeeHistoryRow[] = [];
    for (const item of items) {
      for (const p of item.invoice.payments) {
        rows.push({
          invoiceId: item.invoice.id,
          invoiceNo: item.invoice.invoiceNo,
          date: p.paymentDate,
          amount: p.amount.toNumber(),
          method: p.paymentMethod?.name ?? null,
          feeName: item.itemName,
          cancelled: item.invoice.status === "CANCELLED",
        });
      }
    }
    rows.sort((a, b) => b.date.getTime() - a.date.getTime());
    return rows;
  }

  async create(input: CreateStudentFeeInput, actor: ActorContext): Promise<StudentFeeDto> {
    const enrollment = await this.prisma.studentEnrollment.findUnique({
      where: { id: input.enrollmentId },
      include: { feePlan: true },
    });
    if (!enrollment) throw BadRequest("Enrollment not found");

    // The fee plan driving the charge: explicit body plan wins, else the
    // enrollment's own plan.
    const feePlanId = input.feePlanId ?? enrollment.feePlanId ?? null;
    let resolvedPlan = enrollment.feePlan;
    if (input.feePlanId && input.feePlanId !== enrollment.feePlanId) {
      resolvedPlan = await this.prisma.feePlan.findUnique({ where: { id: input.feePlanId } });
      if (!resolvedPlan) throw BadRequest("Fee plan not found");
    }

    // Resolve the charge amount: explicit body value, else the plan's amount.
    const amount =
      input.amount ?? (resolvedPlan ? resolvedPlan.amount.toNumber() : undefined);
    if (amount === undefined) {
      throw BadRequest("Amount could not be resolved — provide an amount or a fee plan");
    }

    const discountAmount = input.discountAmount;
    const finalAmount = Math.max(0, amount - discountAmount);

    const fee = await this.repo.create({
      studentId: enrollment.studentId,
      enrollmentId: enrollment.id,
      feePlanId,
      amount,
      discountAmount,
      finalAmount,
      dueDate: input.dueDate ?? null,
      createdBy: actor.userId,
    });

    const dto = toStudentFeeDto(fee);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.FEE_GENERATED,
      module: MODULE,
      recordId: dto.id,
      newData: dto,
      ipAddress: actor.ip,
    });
    return dto;
  }
}
