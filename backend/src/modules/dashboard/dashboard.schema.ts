import { z } from "zod";
import { invoiceSummarySchema } from "../billing/billing.schema.js";

export const salesSummaryResponse = z.object({
  data: z.object({
    invoices: z.number().int(),
    revenue: z.number(),
    itemsSold: z.number().int(),
  }),
});

export const topProductsResponse = z.object({
  data: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      quantitySold: z.number().int(),
      revenue: z.number(),
      stockRemaining: z.number().int().nullable(),
    }),
  ),
});

export const recentInvoicesResponse = z.object({
  data: z.array(invoiceSummarySchema),
});

export const lowStockResponse = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      sku: z.string(),
      stockQuantity: z.number().int(),
      minimumStock: z.number().int(),
    }),
  ),
});

export const paymentsByMethodResponse = z.object({
  data: z.array(
    z.object({
      paymentMethodId: z.string(),
      name: z.string(),
      amount: z.number(),
    }),
  ),
});

/** Inclusive date window shared by the analytical dashboard endpoints. */
const dateRange = {
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
};

export const limitQuery = z.object({
  limit: z.coerce.number().int().positive().max(50).default(5),
});

/** Date window only (no limit) — for sales summary and payments. */
export const rangeQuery = z.object(dateRange);

/** Limit + optional date window — for top products and recent invoices. */
export const limitRangeQuery = z.object({
  limit: z.coerce.number().int().positive().max(50).default(5),
  ...dateRange,
});
