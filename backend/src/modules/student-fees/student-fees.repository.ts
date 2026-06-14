import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { toSkipTake } from "../../lib/pagination.js";
import { studentFeeInclude } from "./student-fees.types.js";
import type { ListStudentFeesQuery, StudentFeeWithRelations } from "./student-fees.types.js";

type Status = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

export interface PersistStudentFeeInput {
  studentId: string;
  enrollmentId: string;
  feePlanId: string | null;
  amount: number;
  discountAmount: number;
  finalAmount: number;
  dueDate: Date | null;
  createdBy: string | null;
}

export class StudentFeesRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(
    query: ListStudentFeesQuery,
  ): Promise<{ rows: StudentFeeWithRelations[]; total: number }> {
    const where: Prisma.StudentFeeWhereInput = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.enrollmentId) where.enrollmentId = query.enrollmentId;
    if (query.feePlanId) where.feePlanId = query.feePlanId;
    if (query.status) where.status = query.status;
    // Outstanding charges are anything not yet fully settled.
    if (query.outstanding) where.status = { in: ["PENDING", "PARTIAL", "OVERDUE"] };
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
      this.db.studentFee.findMany({
        where,
        include: studentFeeInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      this.db.studentFee.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string): Promise<StudentFeeWithRelations | null> {
    return this.db.studentFee.findUnique({
      where: { id },
      include: studentFeeInclude,
    });
  }

  create(input: PersistStudentFeeInput): Promise<StudentFeeWithRelations> {
    return this.db.studentFee.create({
      data: {
        studentId: input.studentId,
        enrollmentId: input.enrollmentId,
        feePlanId: input.feePlanId,
        amount: new Prisma.Decimal(input.amount),
        discountAmount: new Prisma.Decimal(input.discountAmount),
        finalAmount: new Prisma.Decimal(input.finalAmount),
        paidAmount: new Prisma.Decimal(0),
        dueDate: input.dueDate,
        status: "PENDING" satisfies Status,
        createdBy: input.createdBy,
      },
      include: studentFeeInclude,
    });
  }
}
