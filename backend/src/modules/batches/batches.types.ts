import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  batchSchema,
  createBatchBody,
  listBatchesQuery,
  updateBatchBody,
} from "./batches.schema.js";

export type BatchDto = z.infer<typeof batchSchema>;
export type CreateBatchInput = z.infer<typeof createBatchBody>;
export type UpdateBatchInput = z.infer<typeof updateBatchBody>;
export type ListBatchesQuery = z.infer<typeof listBatchesQuery>;

export const batchInclude = {
  program: { select: { id: true, name: true } },
  trainer: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { enrollments: true } },
} satisfies Prisma.TrainingBatchInclude;

export type BatchWithRelations = Prisma.TrainingBatchGetPayload<{ include: typeof batchInclude }>;

export function toBatchDto(b: BatchWithRelations): BatchDto {
  const trainer = b.trainer
    ? { id: b.trainer.id, firstName: b.trainer.firstName, lastName: b.trainer.lastName }
    : null;
  return {
    id: b.id,
    trainingProgramId: b.trainingProgramId,
    program: { id: b.program.id, name: b.program.name },
    trainerId: b.trainerId,
    trainer,
    trainerName: trainer ? `${trainer.firstName} ${trainer.lastName}` : null,
    name: b.name,
    startTime: b.startTime,
    endTime: b.endTime,
    startDate: b.startDate,
    endDate: b.endDate,
    capacity: b.capacity,
    currentStrength: b.currentStrength,
    status: b.status,
    enrollmentsCount: b._count.enrollments,
    createdBy: b.createdBy,
    updatedBy: b.updatedBy,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}
