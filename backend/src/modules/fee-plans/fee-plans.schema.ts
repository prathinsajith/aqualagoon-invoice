import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";
import { productStatusSchema } from "../product-categories/product-categories.schema.js";
import { trainingDurationTypeSchema } from "../training-programs/training-programs.schema.js";

/** Public shape of a fee plan, with its nested program. */
export const feePlanSchema = z.object({
  id: z.string(),
  program: z.object({ id: z.string(), name: z.string() }),
  name: z.string(),
  durationType: trainingDurationTypeSchema,
  durationDays: z.number().int(),
  amount: z.number(),
  description: z.string().nullable(),
  status: productStatusSchema,
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

const money = z.number().min(0, "Cannot be negative");

export const createFeePlanBody = z.object({
  trainingProgramId: z.uuid(),
  name: z.string().trim().min(2, "Name is required").max(120),
  durationType: trainingDurationTypeSchema,
  durationDays: z.number().int().min(1, "At least 1 day").max(3650).default(30),
  amount: money,
  description: z.string().trim().max(1000).nullish(),
  status: productStatusSchema.default("ACTIVE"),
});

export const updateFeePlanBody = z
  .object({
    trainingProgramId: z.uuid(),
    name: z.string().trim().min(2).max(120),
    durationType: trainingDurationTypeSchema,
    durationDays: z.number().int().min(1).max(3650),
    amount: money,
    description: z.string().trim().max(1000).nullable(),
    status: productStatusSchema,
  })
  .partial();

export const feePlanIdParams = z.object({ id: z.uuid() });

export const listFeePlansQuery = paginationQuery.extend({
  status: productStatusSchema.optional(),
  trainingProgramId: z.uuid().optional(),
  sortBy: z.enum(["createdAt", "name", "amount"]).default("createdAt"),
});
