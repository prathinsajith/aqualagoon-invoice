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
  student: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
  batch: {
    select: {
      id: true,
      name: true,
      program: { select: { id: true, name: true } },
    },
  },
  feePlan: { select: { id: true, name: true, amount: true, durationDays: true } },
} satisfies Prisma.StudentEnrollmentInclude;

export type EnrollmentWithRelations = Prisma.StudentEnrollmentGetPayload<{
  include: typeof enrollmentInclude;
}>;

export function toEnrollmentDto(e: EnrollmentWithRelations, attendedDays = 0): EnrollmentDto {
  // Session-pack model: a fee plan grants `durationDays` training sessions, and
  // every day the student is marked present/late burns one. Days left therefore
  // counts down with attendance — not with the calendar. Absences and holidays
  // never consume a session.
  let daysRemaining: number | null = null;
  let attended: number | null = null;
  if (e.feePlan) {
    attended = attendedDays;
    daysRemaining = Math.max(0, e.feePlan.durationDays - attendedDays);
  }

  return {
    id: e.id,
    student: {
      id: e.student.id,
      firstName: e.student.firstName,
      lastName: e.student.lastName,
      photoUrl: e.student.photoUrl,
    },
    batch: {
      id: e.batch.id,
      name: e.batch.name,
      program: { id: e.batch.program.id, name: e.batch.program.name },
    },
    feePlan: e.feePlan
      ? {
          id: e.feePlan.id,
          name: e.feePlan.name,
          amount: e.feePlan.amount.toNumber(),
          durationDays: e.feePlan.durationDays,
        }
      : null,
    joinedDate: e.joinedDate,
    attendedDays: attended,
    daysRemaining,
    status: e.status,
    createdAt: e.createdAt,
  };
}
