import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  createPassTypeBody,
  listPassTypesQuery,
  passTypeSchema,
  updatePassTypeBody,
} from "./pass-types.schema.js";

export type PassTypeDto = z.infer<typeof passTypeSchema>;
export type CreatePassTypeInput = z.infer<typeof createPassTypeBody>;
export type UpdatePassTypeInput = z.infer<typeof updatePassTypeBody>;
export type ListPassTypesQuery = z.infer<typeof listPassTypesQuery>;

export const passTypeInclude = {
  _count: { select: { userPasses: true } },
} satisfies Prisma.PassTypeInclude;

export type PassTypeWithCount = Prisma.PassTypeGetPayload<{ include: typeof passTypeInclude }>;

export function toPassTypeDto(p: PassTypeWithCount): PassTypeDto {
  return {
    id: p.id,
    type: p.type,
    name: p.name,
    description: p.description,
    durationType: p.durationType,
    durationValue: p.durationValue,
    entryType: p.entryType,
    allowedEntries: p.allowedEntries,
    maxEntriesPerDay: p.maxEntriesPerDay,
    price: p.price.toNumber(),
    discountType: p.discountType,
    discountValue: p.discountValue.toNumber(),
    status: p.status,
    passesCount: p._count.userPasses,
    createdBy: p.createdBy,
    updatedBy: p.updatedBy,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    deletedAt: p.deletedAt,
  };
}
