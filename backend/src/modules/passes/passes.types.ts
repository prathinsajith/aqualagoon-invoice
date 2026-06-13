import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  listPassesQuery,
  userPassDetailSchema,
  userPassSchema,
} from "./passes.schema.js";

export type UserPassDto = z.infer<typeof userPassSchema>;
export type UserPassDetailDto = z.infer<typeof userPassDetailSchema>;
export type ListPassesQuery = z.infer<typeof listPassesQuery>;

export const userPassInclude = {
  passType: {
    select: { id: true, name: true, type: true, durationType: true, durationValue: true, entryType: true },
  },
  user: { select: { firstName: true, lastName: true } },
} satisfies Prisma.UserPassInclude;

export type UserPassWithRelations = Prisma.UserPassGetPayload<{ include: typeof userPassInclude }>;

export const userPassDetailInclude = {
  ...userPassInclude,
  usageLogs: { orderBy: { entryTime: "desc" as const } },
} satisfies Prisma.UserPassInclude;

export type UserPassDetail = Prisma.UserPassGetPayload<{ include: typeof userPassDetailInclude }>;

export function toUserPassDto(p: UserPassWithRelations): UserPassDto {
  return {
    id: p.id,
    userId: p.userId,
    // Prefer the name captured at sale; fall back to the linked account.
    holderName: p.holderName ?? (p.user ? `${p.user.firstName} ${p.user.lastName}` : null),
    passTypeId: p.passTypeId,
    passType: {
      id: p.passType.id,
      name: p.passType.name,
      type: p.passType.type,
      durationType: p.passType.durationType,
      durationValue: p.passType.durationValue,
      entryType: p.passType.entryType,
    },
    invoiceId: p.invoiceId,
    passNumber: p.passNumber,
    startTime: p.startTime,
    expiryTime: p.expiryTime,
    originalPrice: p.originalPrice.toNumber(),
    discountAmount: p.discountAmount.toNumber(),
    finalAmount: p.finalAmount.toNumber(),
    remainingEntries: p.remainingEntries,
    status: p.status,
    activatedAt: p.activatedAt,
    createdBy: p.createdBy,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function toUserPassDetailDto(p: UserPassDetail): UserPassDetailDto {
  return {
    ...toUserPassDto(p),
    usageLogs: p.usageLogs.map((l) => ({
      id: l.id,
      entryTime: l.entryTime,
      exitTime: l.exitTime,
      remarks: l.remarks,
      createdAt: l.createdAt,
    })),
  };
}
