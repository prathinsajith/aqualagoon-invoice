import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";
import { productStatusSchema } from "../product-categories/product-categories.schema.js";

/** Shared training-duration unit. Exported for reuse by sibling modules. */
export const trainingDurationTypeSchema = z.enum(["MONTH", "QUARTER", "YEAR", "CUSTOM"]);

/** Public shape of a training program, with its nested type and child counts. */
export const trainingProgramSchema = z.object({
  id: z.string(),
  trainingType: z.object({ id: z.string(), name: z.string() }),
  name: z.string(),
  description: z.string().nullable(),
  durationType: trainingDurationTypeSchema,
  durationValue: z.number().int(),
  defaultFee: z.number(),
  status: productStatusSchema,
  batchesCount: z.number().int(),
  feePlansCount: z.number().int(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

const money = z.number().min(0, "Cannot be negative");
const count = z.number().int("Whole numbers only").positive("Must be at least 1");

export const createTrainingProgramBody = z.object({
  trainingTypeId: z.uuid(),
  name: z.string().trim().min(2, "Name is required").max(120),
  description: z.string().trim().max(1000).nullish(),
  durationType: trainingDurationTypeSchema,
  durationValue: count,
  defaultFee: money.default(0),
  status: productStatusSchema.default("ACTIVE"),
});

export const updateTrainingProgramBody = z
  .object({
    trainingTypeId: z.uuid(),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).nullable(),
    durationType: trainingDurationTypeSchema,
    durationValue: count,
    defaultFee: money,
    status: productStatusSchema,
  })
  .partial();

export const trainingProgramIdParams = z.object({ id: z.uuid() });

export const listTrainingProgramsQuery = paginationQuery.extend({
  status: productStatusSchema.optional(),
  trainingTypeId: z.uuid().optional(),
  sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
});
