import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";

/** Public shape of a payment method, including how many payments use it. */
export const paymentMethodSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  displayOrder: z.number().int(),
  usageCount: z.number().int(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const createPaymentMethodBody = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).nullish(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
});

export const updatePaymentMethodBody = z
  .object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(500).nullable(),
    isActive: z.boolean(),
    displayOrder: z.number().int().min(0),
  })
  .partial();

export const paymentMethodIdParams = z.object({ id: z.uuid() });

export const listPaymentMethodsQuery = paginationQuery.extend({
  // Optional filter; the billing UI passes isActive=true to hide disabled ones.
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(["displayOrder", "name", "createdAt"]).default("displayOrder"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
