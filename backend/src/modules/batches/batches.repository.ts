import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { toSkipTake } from "../../lib/pagination.js";
import { batchInclude } from "./batches.types.js";
import type { BatchWithRelations, ListBatchesQuery } from "./batches.types.js";

type Status = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface PersistBatchInput {
  trainingProgramId: string;
  trainerId?: string | null;
  name: string;
  startTime?: string | null;
  endTime?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  capacity: number;
  status: Status;
  createdBy: string | null;
}

export interface UpdateBatchData {
  trainingProgramId?: string;
  trainerId?: string | null;
  name?: string;
  startTime?: string | null;
  endTime?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  capacity?: number;
  status?: Status;
  updatedBy: string | null;
}

export class BatchesRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(query: ListBatchesQuery): Promise<{ rows: BatchWithRelations[]; total: number }> {
    const where: Prisma.TrainingBatchWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.trainingProgramId) where.trainingProgramId = query.trainingProgramId;
    if (query.trainerId) where.trainerId = query.trainerId;
    if (query.search) where.name = { contains: query.search, mode: "insensitive" };

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await Promise.all([
      this.db.trainingBatch.findMany({
        where,
        include: batchInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      this.db.trainingBatch.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string): Promise<BatchWithRelations | null> {
    return this.db.trainingBatch.findFirst({
      where: { id },
      include: batchInclude,
    });
  }

  async findProgramId(id: string): Promise<string | null> {
    const row = await this.db.trainingProgram.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  /** Returns true if the user exists, is not deleted, and holds the "Trainer" role. */
  async isTrainer(userId: string): Promise<boolean> {
    const row = await this.db.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        userRoles: { some: { role: { name: "Trainer" } } },
      },
      select: { id: true },
    });
    return row !== null;
  }

  create(input: PersistBatchInput): Promise<BatchWithRelations> {
    return this.db.trainingBatch.create({
      data: {
        trainingProgramId: input.trainingProgramId,
        trainerId: input.trainerId ?? null,
        name: input.name,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        capacity: input.capacity,
        // currentStrength is denormalized; clients never set it.
        currentStrength: 0,
        status: input.status,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
      },
      include: batchInclude,
    });
  }

  update(id: string, data: UpdateBatchData): Promise<BatchWithRelations> {
    return this.db.trainingBatch.update({
      where: { id },
      data,
      include: batchInclude,
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.db.trainingBatch.delete({ where: { id } });
  }
}
