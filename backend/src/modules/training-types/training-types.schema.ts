import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";
import { productStatusSchema } from "../product-categories/product-categories.schema.js";

/** Public shape of a training type, including how many programs belong to it. */
export const trainingTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: productStatusSchema,
  programsCount: z.number().int(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const createTrainingTypeBody = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  description: z.string().trim().max(1000).nullish(),
  status: productStatusSchema.default("ACTIVE"),
});

export const updateTrainingTypeBody = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).nullable(),
    status: productStatusSchema,
  })
  .partial();

export const trainingTypeIdParams = z.object({ id: z.uuid() });

export const listTrainingTypesQuery = paginationQuery.extend({
  status: productStatusSchema.optional(),
  sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
});
