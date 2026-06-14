import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";

export const batchStatusSchema = z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]);

const timeOfDay = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Must be a HH:mm time");

/** Public shape of a training batch, including a nested program & trainer. */
export const batchSchema = z.object({
  id: z.string(),
  trainingProgramId: z.string(),
  program: z.object({ id: z.string(), name: z.string() }),
  trainerId: z.string().nullable(),
  trainer: z
    .object({ id: z.string(), firstName: z.string(), lastName: z.string() })
    .nullable(),
  trainerName: z.string().nullable(),
  name: z.string(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  capacity: z.number().int(),
  currentStrength: z.number().int(),
  status: batchStatusSchema,
  enrollmentsCount: z.number().int(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const capacity = z.number().int("Whole numbers only").min(0, "Cannot be negative");

export const createBatchBody = z.object({
  trainingProgramId: z.uuid(),
  trainerId: z.uuid().nullish(),
  name: z.string().trim().min(2, "Name is required").max(120),
  startTime: timeOfDay.nullish(),
  endTime: timeOfDay.nullish(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  capacity: capacity.default(0),
  status: batchStatusSchema.default("ACTIVE"),
});

export const updateBatchBody = z
  .object({
    trainingProgramId: z.uuid(),
    trainerId: z.uuid().nullable(),
    name: z.string().trim().min(2).max(120),
    startTime: timeOfDay.nullable(),
    endTime: timeOfDay.nullable(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    capacity,
    status: batchStatusSchema,
  })
  .partial();

export const batchIdParams = z.object({ id: z.uuid() });

export const listBatchesQuery = paginationQuery.extend({
  status: batchStatusSchema.optional(),
  trainingProgramId: z.uuid().optional(),
  trainerId: z.uuid().optional(),
  sortBy: z.enum(["createdAt", "name", "startDate"]).default("createdAt"),
});
