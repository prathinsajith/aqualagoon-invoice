import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  createEnrollmentBody,
  enrollmentSchema,
  listEnrollmentsQuery,
  updateEnrollmentBody,
} from "./enrollments.schema.js";

export type EnrollmentDto = z.infer<typeof enrollmentSchema>;
export type ListEnrollmentsQuery = z.infer<typeof listEnrollmentsQuery>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentBody>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentBody>;

export const enrollmentInclude = {
  student: { select: { id: true, firstName: true, lastName: true } },
  batch: {
    select: {
      id: true,
      name: true,
      program: { select: { id: true, name: true } },
    },
  },
  feePlan: { select: { id: true, name: true, amount: true } },
} satisfies Prisma.StudentEnrollmentInclude;

export type EnrollmentWithRelations = Prisma.StudentEnrollmentGetPayload<{
  include: typeof enrollmentInclude;
}>;

export function toEnrollmentDto(e: EnrollmentWithRelations): EnrollmentDto {
  return {
    id: e.id,
    student: {
      id: e.student.id,
      firstName: e.student.firstName,
      lastName: e.student.lastName,
    },
    batch: {
      id: e.batch.id,
      name: e.batch.name,
      program: { id: e.batch.program.id, name: e.batch.program.name },
    },
    feePlan: e.feePlan
      ? { id: e.feePlan.id, name: e.feePlan.name, amount: e.feePlan.amount.toNumber() }
      : null,
    joinedDate: e.joinedDate,
    status: e.status,
    createdAt: e.createdAt,
  };
}
