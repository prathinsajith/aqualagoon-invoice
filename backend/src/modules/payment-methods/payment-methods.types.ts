import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  createPaymentMethodBody,
  listPaymentMethodsQuery,
  paymentMethodSchema,
  updatePaymentMethodBody,
} from "./payment-methods.schema.js";

export type PaymentMethodDto = z.infer<typeof paymentMethodSchema>;
export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodBody>;
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodBody>;
export type ListPaymentMethodsQuery = z.infer<typeof listPaymentMethodsQuery>;

export const paymentMethodInclude = {
  _count: { select: { payments: true } },
} satisfies Prisma.PaymentMethodInclude;

export type PaymentMethodWithCount = Prisma.PaymentMethodGetPayload<{
  include: typeof paymentMethodInclude;
}>;

export function toPaymentMethodDto(m: PaymentMethodWithCount): PaymentMethodDto {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    isActive: m.isActive,
    displayOrder: m.displayOrder,
    usageCount: m._count.payments,
    createdBy: m.createdBy,
    updatedBy: m.updatedBy,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    deletedAt: m.deletedAt,
  };
}
