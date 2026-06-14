import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  createTrainingProgramBody,
  listTrainingProgramsQuery,
  trainingProgramSchema,
  updateTrainingProgramBody,
} from "./training-programs.schema.js";

export type TrainingProgramDto = z.infer<typeof trainingProgramSchema>;
export type CreateTrainingProgramInput = z.infer<typeof createTrainingProgramBody>;
export type UpdateTrainingProgramInput = z.infer<typeof updateTrainingProgramBody>;
export type ListTrainingProgramsQuery = z.infer<typeof listTrainingProgramsQuery>;

export const trainingProgramInclude = {
  trainingType: { select: { id: true, name: true } },
  _count: { select: { batches: true, feePlans: { where: { deletedAt: null } } } },
} satisfies Prisma.TrainingProgramInclude;

export type TrainingProgramWithRelations = Prisma.TrainingProgramGetPayload<{
  include: typeof trainingProgramInclude;
}>;

export function toTrainingProgramDto(p: TrainingProgramWithRelations): TrainingProgramDto {
  return {
    id: p.id,
    trainingType: { id: p.trainingType.id, name: p.trainingType.name },
    name: p.name,
    description: p.description,
    durationType: p.durationType,
    durationValue: p.durationValue,
    defaultFee: p.defaultFee.toNumber(),
    status: p.status,
    batchesCount: p._count.batches,
    feePlansCount: p._count.feePlans,
    createdBy: p.createdBy,
    updatedBy: p.updatedBy,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    deletedAt: p.deletedAt,
  };
}
