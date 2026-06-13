import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";

/** ACTIVE / INACTIVE — distinct from soft-delete (deletedAt). */
export const productStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

/** Public shape of a product category, including its active-product count. */
export const productCategorySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: productStatusSchema,
  productsCount: z.number().int(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const createProductCategoryBody = z.object({
  name: z.string().trim().min(2).max(120),
  // Accepts null (client sends null for an empty description) or omission.
  description: z.string().trim().max(1000).nullish(),
  status: productStatusSchema.default("ACTIVE"),
});

export const updateProductCategoryBody = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).nullable(),
    status: productStatusSchema,
  })
  .partial();

export const categoryIdParams = z.object({ id: z.uuid() });

export const listProductCategoriesQuery = paginationQuery.extend({
  status: productStatusSchema.optional(),
  sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
});
