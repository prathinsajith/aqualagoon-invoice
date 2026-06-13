import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  catalogItemSchema,
  checkoutBody,
  invoiceSchema,
  invoiceSummarySchema,
  listInvoicesQuery,
} from "./billing.schema.js";

export type CheckoutInput = z.infer<typeof checkoutBody>;
export type InvoiceDto = z.infer<typeof invoiceSchema>;
export type InvoiceSummaryDto = z.infer<typeof invoiceSummarySchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuery>;
export type CatalogItemDto = z.infer<typeof catalogItemSchema>;

/** A pass issued by a checkout, returned to the POS for the receipt. */
export interface IssuedPass {
  id: string;
  passNumber: string;
  passTypeName: string;
  expiryTime: Date;
}

const dec = (d: Prisma.Decimal): number => d.toNumber();

export const invoiceInclude = {
  items: true,
  payments: { include: { paymentMethod: { select: { name: true } } } },
} satisfies Prisma.InvoiceInclude;

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{ include: typeof invoiceInclude }>;

export const invoiceSummaryInclude = {
  _count: { select: { items: true } },
} satisfies Prisma.InvoiceInclude;

export type InvoiceWithCount = Prisma.InvoiceGetPayload<{ include: typeof invoiceSummaryInclude }>;

export function toInvoiceDto(inv: InvoiceWithRelations): InvoiceDto {
  return {
    id: inv.id,
    invoiceNo: inv.invoiceNo,
    customerId: inv.customerId,
    invoiceType: inv.invoiceType,
    subtotal: dec(inv.subtotal),
    discountAmount: dec(inv.discountAmount),
    taxAmount: dec(inv.taxAmount),
    totalAmount: dec(inv.totalAmount),
    paidAmount: dec(inv.paidAmount),
    balanceAmount: dec(inv.balanceAmount),
    status: inv.status,
    notes: inv.notes,
    createdBy: inv.createdBy,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
    items: inv.items.map((it) => ({
      id: it.id,
      itemType: it.itemType,
      itemId: it.itemId,
      itemName: it.itemName,
      quantity: it.quantity,
      unitPrice: dec(it.unitPrice),
      discountAmount: dec(it.discountAmount),
      taxAmount: dec(it.taxAmount),
      totalAmount: dec(it.totalAmount),
    })),
    payments: inv.payments.map((p) => ({
      id: p.id,
      paymentMethodId: p.paymentMethodId,
      paymentMethodName: p.paymentMethod.name,
      amount: dec(p.amount),
      transactionReference: p.transactionReference,
      remarks: p.remarks,
      receivedBy: p.receivedBy,
      paymentDate: p.paymentDate,
    })),
  };
}

export function toInvoiceSummaryDto(inv: InvoiceWithCount): InvoiceSummaryDto {
  return {
    id: inv.id,
    invoiceNo: inv.invoiceNo,
    customerId: inv.customerId,
    invoiceType: inv.invoiceType,
    subtotal: dec(inv.subtotal),
    discountAmount: dec(inv.discountAmount),
    taxAmount: dec(inv.taxAmount),
    totalAmount: dec(inv.totalAmount),
    paidAmount: dec(inv.paidAmount),
    balanceAmount: dec(inv.balanceAmount),
    status: inv.status,
    itemCount: inv._count.items,
    createdBy: inv.createdBy,
    createdAt: inv.createdAt,
  };
}
