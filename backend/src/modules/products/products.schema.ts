import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";
import { productStatusSchema } from "../product-categories/product-categories.schema.js";

/** Compact category reference embedded in a product. */
const categoryRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/** Public shape of a product. Monetary fields are serialized as numbers. */
export const productSchema = z.object({
  id: z.string(),
  sku: z.string(),
  barcode: z.string().nullable(),
  categoryId: z.string(),
  category: categoryRefSchema,
  name: z.string(),
  description: z.string().nullable(),
  purchasePrice: z.number(),
  sellingPrice: z.number(),
  taxPercentage: z.number(),
  imageUrl: z.string().nullable(),
  stockQuantity: z.number().int(),
  minimumStock: z.number().int(),
  status: productStatusSchema,
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

const money = z.number().min(0, "Must be zero or greater");
const count = z.number().int("Must be a whole number").min(0, "Must be zero or greater");

export const createProductBody = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  categoryId: z.uuid("Category is required"),
  // Optional fields accept null (the client sends null for empty inputs) or omission.
  barcode: z.string().trim().min(1).max(64).nullish(),
  description: z.string().trim().max(2000).nullish(),
  purchasePrice: money.default(0),
  sellingPrice: money,
  taxPercentage: z.number().min(0).max(100).default(0),
  stockQuantity: count.default(0),
  minimumStock: count.default(0),
  status: productStatusSchema.default("ACTIVE"),
});

export const updateProductBody = z
  .object({
    name: z.string().trim().min(1).max(200),
    categoryId: z.uuid(),
    barcode: z.string().trim().min(1).max(64).nullable(),
    description: z.string().trim().max(2000).nullable(),
    purchasePrice: money,
    sellingPrice: money,
    taxPercentage: z.number().min(0).max(100),
    stockQuantity: count,
    minimumStock: count,
    status: productStatusSchema,
  })
  .partial();

export const productIdParams = z.object({ id: z.uuid() });

export const listProductsQuery = paginationQuery.extend({
  categoryId: z.uuid().optional(),
  status: productStatusSchema.optional(),
  includeDeleted: z.coerce.boolean().optional(),
  onlyDeleted: z.coerce.boolean().optional(),
  sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
});
