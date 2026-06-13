import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";
import { productStatusSchema } from "../product-categories/product-categories.schema.js";

export const passKindSchema = z.enum(["GUEST", "STUDENT", "VIP", "FAMILY", "CORPORATE"]);
export const durationTypeSchema = z.enum(["HOUR", "DAY", "MONTH", "YEAR"]);
export const entryTypeSchema = z.enum(["LIMITED", "UNLIMITED"]);
export const discountTypeSchema = z.enum(["NONE", "FIXED", "PERCENTAGE"]);

/** Public shape of a pass type, including how many passes were sold from it. */
export const passTypeSchema = z.object({
  id: z.string(),
  type: passKindSchema,
  name: z.string(),
  description: z.string().nullable(),
  durationType: durationTypeSchema,
  durationValue: z.number().int(),
  entryType: entryTypeSchema,
  allowedEntries: z.number().int().nullable(),
  maxEntriesPerDay: z.number().int().nullable(),
  price: z.number(),
  discountType: discountTypeSchema,
  discountValue: z.number(),
  status: productStatusSchema,
  passesCount: z.number().int(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

const money = z.number().min(0, "Cannot be negative");
const count = z.number().int("Whole numbers only").positive("Must be at least 1");

export const createPassTypeBody = z.object({
  type: passKindSchema,
  name: z.string().trim().min(2, "Name is required").max(120),
  description: z.string().trim().max(1000).nullish(),
  durationType: durationTypeSchema,
  durationValue: count,
  entryType: entryTypeSchema.default("UNLIMITED"),
  allowedEntries: count.nullish(),
  maxEntriesPerDay: count.nullish(),
  price: money,
  discountType: discountTypeSchema.default("NONE"),
  discountValue: money.default(0),
  status: productStatusSchema.default("ACTIVE"),
});

export const updatePassTypeBody = z
  .object({
    type: passKindSchema,
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).nullable(),
    durationType: durationTypeSchema,
    durationValue: count,
    entryType: entryTypeSchema,
    allowedEntries: count.nullable(),
    maxEntriesPerDay: count.nullable(),
    price: money,
    discountType: discountTypeSchema,
    discountValue: money,
    status: productStatusSchema,
  })
  .partial();

export const passTypeIdParams = z.object({ id: z.uuid() });

export const listPassTypesQuery = paginationQuery.extend({
  type: passKindSchema.optional(),
  status: productStatusSchema.optional(),
  sortBy: z.enum(["createdAt", "name", "price"]).default("createdAt"),
});
