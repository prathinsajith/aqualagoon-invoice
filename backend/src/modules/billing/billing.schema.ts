import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";
import { passKindSchema } from "../pass-types/pass-types.schema.js";

export const invoiceStatusSchema = z.enum([
  "DRAFT",
  "PENDING",
  "PARTIAL",
  "PAID",
  "CANCELLED",
  "REFUNDED",
]);
export const invoiceTypeSchema = z.enum(["PRODUCT", "PASS", "TRAINING", "MIXED"]);
export const invoiceItemTypeSchema = z.enum([
  "PRODUCT",
  "PASS",
  "TRAINING",
  "SERVICE",
  "MEMBERSHIP",
]);

// --- Checkout (POS) ---------------------------------------------------------

const money = z.number().min(0, "Cannot be negative");

/** A sellable line: a PRODUCT, a PASS, or a TRAINING fee, referenced by its id. */
export const checkoutItemSchema = z.object({
  itemType: z.enum(["PRODUCT", "PASS", "TRAINING"]),
  // PRODUCT → product id, PASS → pass-type id, TRAINING → student-fee id.
  id: z.uuid(),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  // Optional per-line discount (products only; ignored for passes & fees).
  discountAmount: money.default(0),
});

export const checkoutBody = z.object({
  customerId: z.uuid().nullish(),
  notes: z.string().trim().max(1000).nullish(),
  // Name of the person the pass is for (used when selling to a walk-in with no
  // account). Applied to every pass issued by this sale.
  holderName: z.string().trim().max(120).nullish(),
  items: z.array(checkoutItemSchema).min(1, "Add at least one item"),
  payment: z.object({
    paymentMethodId: z.uuid(),
    // Amount tendered by the customer (must cover the total — full payment phase).
    paidAmount: money,
    transactionReference: z.string().trim().max(120).nullish(),
    remarks: z.string().trim().max(500).nullish(),
  }),
});

/** Unified sellable catalog entry (product, pass, or training fee) for POS search. */
export const catalogItemSchema = z.object({
  itemType: z.enum(["PRODUCT", "PASS", "TRAINING"]),
  id: z.string(),
  name: z.string(),
  sku: z.string().nullable(),
  price: z.number(),
  taxPercentage: z.number(),
  // Null for passes (no stock concept); product stock otherwise.
  stockQuantity: z.number().int().nullable(),
  subtitle: z.string().nullable(),
  imageUrl: z.string().nullable(),
  // The pass kind (null for products) — drives POS quantity rules.
  passKind: passKindSchema.nullable(),
});

export const catalogResponse = z.object({ data: z.array(catalogItemSchema) });

// --- Pay a training fee (balance / instalment) ------------------------------

export const payFeeParams = z.object({ id: z.uuid() });
export const payFeeBody = z.object({
  amount: money.positive("Amount must be greater than zero"),
  paymentMethodId: z.uuid(),
});

export const catalogQuery = z.object({
  search: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().positive().max(50).default(24),
  // When set, the selected customer's outstanding training fees are included as
  // TRAINING catalog items so the cashier can charge them at the POS.
  customerId: z.uuid().optional(),
});

// --- DTOs -------------------------------------------------------------------

export const invoiceItemSchema = z.object({
  id: z.string(),
  itemType: invoiceItemTypeSchema,
  itemId: z.string(),
  itemName: z.string(),
  quantity: z.number().int(),
  unitPrice: z.number(),
  discountAmount: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
});

export const paymentSchema = z.object({
  id: z.string(),
  paymentMethodId: z.string(),
  paymentMethodName: z.string(),
  amount: z.number(),
  transactionReference: z.string().nullable(),
  remarks: z.string().nullable(),
  receivedBy: z.string().nullable(),
  paymentDate: z.date(),
});

const invoiceMoneyFields = {
  subtotal: z.number(),
  discountAmount: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  balanceAmount: z.number(),
};

export const invoiceSchema = z.object({
  id: z.string(),
  invoiceNo: z.string(),
  customerId: z.string().nullable(),
  invoiceType: invoiceTypeSchema,
  ...invoiceMoneyFields,
  status: invoiceStatusSchema,
  notes: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  items: z.array(invoiceItemSchema),
  payments: z.array(paymentSchema),
});

/** Lighter shape for list rows (no nested items/payments). */
export const invoiceSummarySchema = z.object({
  id: z.string(),
  invoiceNo: z.string(),
  customerId: z.string().nullable(),
  invoiceType: invoiceTypeSchema,
  ...invoiceMoneyFields,
  status: invoiceStatusSchema,
  itemCount: z.number().int(),
  createdBy: z.string().nullable(),
  createdAt: z.date(),
});

export const checkoutResponse = z.object({
  data: z.object({
    invoice: invoiceSchema,
    change: z.number(),
    // Passes issued by this sale (empty for product-only invoices).
    passes: z.array(
      z.object({
        id: z.string(),
        passNumber: z.string(),
        passTypeName: z.string(),
        holderName: z.string().nullable(),
        expiryTime: z.date(),
      }),
    ),
  }),
});

// --- Receipt ----------------------------------------------------------------

export const receiptSchema = z.object({
  data: z.object({
    company: z.object({
      name: z.string(),
      tagline: z.string().nullable(),
      address: z.string().nullable(),
      phone: z.string().nullable(),
      email: z.string().nullable(),
      logoUrl: z.string().nullable(),
    }),
    invoiceNo: z.string(),
    invoiceDate: z.date(),
    status: invoiceStatusSchema,
    cashierName: z.string().nullable(),
    customerId: z.string().nullable(),
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.number().int(),
        unitPrice: z.number(),
        discountAmount: z.number(),
        taxAmount: z.number(),
        totalAmount: z.number(),
      }),
    ),
    subtotal: z.number(),
    discountAmount: z.number(),
    taxAmount: z.number(),
    totalAmount: z.number(),
    paidAmount: z.number(),
    balanceAmount: z.number(),
    payments: z.array(
      z.object({
        methodName: z.string(),
        amount: z.number(),
        transactionReference: z.string().nullable(),
      }),
    ),
  }),
});

// --- Queries / params -------------------------------------------------------

export const invoiceIdParams = z.object({ id: z.uuid() });

export const listInvoicesQuery = paginationQuery.extend({
  status: invoiceStatusSchema.optional(),
  invoiceType: invoiceTypeSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(["createdAt", "totalAmount", "invoiceNo"]).default("createdAt"),
});

export const cancelInvoiceBody = z.object({
  reason: z.string().trim().max(500).nullish(),
});
