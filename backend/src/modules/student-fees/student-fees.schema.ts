import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";

export const studentFeeStatusSchema = z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE"]);

const studentRefSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

const feePlanRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/** Public shape of a student fee charge. */
export const studentFeeSchema = z.object({
  id: z.string(),
  student: studentRefSchema,
  enrollmentId: z.string(),
  feePlan: feePlanRefSchema.nullable(),
  amount: z.number(),
  discountAmount: z.number(),
  finalAmount: z.number(),
  paidAmount: z.number(),
  dueDate: z.date().nullable(),
  status: studentFeeStatusSchema,
  invoiceId: z.string().nullable(),
  createdAt: z.date(),
});

const money = z.number().min(0, "Cannot be negative");

export const createStudentFeeBody = z.object({
  enrollmentId: z.uuid(),
  feePlanId: z.uuid().nullish(),
  // When omitted, the amount is resolved from the fee plan.
  amount: money.optional(),
  discountAmount: money.default(0),
  dueDate: z.coerce.date().nullish(),
});

export const studentFeeIdParams = z.object({ id: z.uuid() });

export const listStudentFeesQuery = paginationQuery.extend({
  studentId: z.uuid().optional(),
  enrollmentId: z.uuid().optional(),
  status: studentFeeStatusSchema.optional(),
  feePlanId: z.uuid().optional(),
  // Convenience flag: limit to charges still owing (PENDING/PARTIAL/OVERDUE).
  outstanding: z.coerce.boolean().optional(),
  sortBy: z.enum(["createdAt", "dueDate"]).default("createdAt"),
});

// --- Per-student fee ledger -------------------------------------------------

/** Roll-up payment state for one enrollment. NO_FEE = no charge raised yet. */
export const ledgerStatusSchema = z.enum(["PAID", "PARTIAL", "PENDING", "OVERDUE", "NO_FEE"]);

export const feeLedgerRowSchema = z.object({
  enrollmentId: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  programName: z.string(),
  batchName: z.string(),
  feeCount: z.number().int(),
  billed: z.number(),
  paid: z.number(),
  balance: z.number(),
  status: ledgerStatusSchema,
});

export const feeLedgerQuery = paginationQuery.extend({
  batchId: z.uuid().optional(),
  status: ledgerStatusSchema.optional(),
  sortBy: z.enum(["createdAt", "joinedDate"]).default("createdAt"),
});
