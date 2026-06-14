import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  createStudentFeeBody,
  feeHistoryQuery,
  feeHistoryRowSchema,
  feeLedgerQuery,
  feeLedgerRowSchema,
  listStudentFeesQuery,
  studentFeeSchema,
} from "./student-fees.schema.js";

export type StudentFeeDto = z.infer<typeof studentFeeSchema>;
export type CreateStudentFeeInput = z.infer<typeof createStudentFeeBody>;
export type ListStudentFeesQuery = z.infer<typeof listStudentFeesQuery>;
export type FeeLedgerQuery = z.infer<typeof feeLedgerQuery>;
export type FeeLedgerRow = z.infer<typeof feeLedgerRowSchema>;
export type FeeHistoryQuery = z.infer<typeof feeHistoryQuery>;
export type FeeHistoryRow = z.infer<typeof feeHistoryRowSchema>;

export const studentFeeInclude = {
  student: { select: { id: true, firstName: true, lastName: true } },
  feePlan: { select: { id: true, name: true } },
} satisfies Prisma.StudentFeeInclude;

export type StudentFeeWithRelations = Prisma.StudentFeeGetPayload<{
  include: typeof studentFeeInclude;
}>;

export function toStudentFeeDto(f: StudentFeeWithRelations): StudentFeeDto {
  return {
    id: f.id,
    student: {
      id: f.student.id,
      firstName: f.student.firstName,
      lastName: f.student.lastName,
    },
    enrollmentId: f.enrollmentId,
    feePlan: f.feePlan ? { id: f.feePlan.id, name: f.feePlan.name } : null,
    amount: f.amount.toNumber(),
    discountAmount: f.discountAmount.toNumber(),
    finalAmount: f.finalAmount.toNumber(),
    paidAmount: f.paidAmount.toNumber(),
    dueDate: f.dueDate,
    status: f.status,
    invoiceId: f.invoiceId,
    createdAt: f.createdAt,
  };
}
