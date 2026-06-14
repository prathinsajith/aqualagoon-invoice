import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  createTrainingTypeBody,
  listTrainingTypesQuery,
  trainingTypeSchema,
  updateTrainingTypeBody,
} from "./training-types.schema.js";

export type TrainingTypeDto = z.infer<typeof trainingTypeSchema>;
export type CreateTrainingTypeInput = z.infer<typeof createTrainingTypeBody>;
export type UpdateTrainingTypeInput = z.infer<typeof updateTrainingTypeBody>;
export type ListTrainingTypesQuery = z.infer<typeof listTrainingTypesQuery>;

export const trainingTypeInclude = {
  _count: { select: { programs: { where: { deletedAt: null } } } },
} satisfies Prisma.TrainingTypeInclude;

export type TrainingTypeWithCount = Prisma.TrainingTypeGetPayload<{
  include: typeof trainingTypeInclude;
}>;

export function toTrainingTypeDto(t: TrainingTypeWithCount): TrainingTypeDto {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    status: t.status,
    programsCount: t._count.programs,
    createdBy: t.createdBy,
    updatedBy: t.updatedBy,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    deletedAt: t.deletedAt,
  };
}
