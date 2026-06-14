import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  createFeePlanBody,
  listFeePlansQuery,
  feePlanSchema,
  updateFeePlanBody,
} from "./fee-plans.schema.js";

export type FeePlanDto = z.infer<typeof feePlanSchema>;
export type CreateFeePlanInput = z.infer<typeof createFeePlanBody>;
export type UpdateFeePlanInput = z.infer<typeof updateFeePlanBody>;
export type ListFeePlansQuery = z.infer<typeof listFeePlansQuery>;

export const feePlanInclude = {
  program: { select: { id: true, name: true } },
  _count: { select: { studentFees: true, enrollments: true } },
} satisfies Prisma.FeePlanInclude;

export type FeePlanWithRelations = Prisma.FeePlanGetPayload<{ include: typeof feePlanInclude }>;

export function toFeePlanDto(p: FeePlanWithRelations): FeePlanDto {
  return {
    id: p.id,
    program: { id: p.program.id, name: p.program.name },
    name: p.name,
    durationType: p.durationType,
    amount: p.amount.toNumber(),
    description: p.description,
    status: p.status,
    createdBy: p.createdBy,
    updatedBy: p.updatedBy,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    deletedAt: p.deletedAt,
  };
}
