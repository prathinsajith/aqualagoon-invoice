import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";

export const enrollmentStatusSchema = z.enum([
  "ACTIVE",
  "COMPLETED",
  "DROPPED",
  "PAUSED",
]);

const studentRefSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

const programRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const batchRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  program: programRefSchema,
});

const feePlanRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
});

export const enrollmentSchema = z.object({
  id: z.string(),
  student: studentRefSchema,
  batch: batchRefSchema,
  feePlan: feePlanRefSchema.nullable(),
  joinedDate: z.date(),
  status: enrollmentStatusSchema,
  createdAt: z.date(),
});

export const enrollmentIdParams = z.object({ id: z.uuid() });

export const listEnrollmentsQuery = paginationQuery.extend({
  studentId: z.uuid().optional(),
  batchId: z.uuid().optional(),
  status: enrollmentStatusSchema.optional(),
  feePlanId: z.uuid().optional(),
  sortBy: z.enum(["createdAt", "joinedDate"]).default("createdAt"),
});

export const createEnrollmentBody = z.object({
  studentId: z.uuid(),
  batchId: z.uuid(),
  feePlanId: z.uuid().nullish(),
});

export const updateEnrollmentBody = z
  .object({
    status: enrollmentStatusSchema.optional(),
    feePlanId: z.uuid().nullish(),
  })
  .refine((b) => b.status !== undefined || b.feePlanId !== undefined, {
    message: "Provide at least one field to update",
  });
