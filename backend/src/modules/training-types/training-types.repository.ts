import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { toSkipTake } from "../../lib/pagination.js";
import { trainingTypeInclude } from "./training-types.types.js";
import type { ListTrainingTypesQuery, TrainingTypeWithCount } from "./training-types.types.js";

type Status = "ACTIVE" | "INACTIVE";

export interface PersistTrainingTypeInput {
  name: string;
  description?: string | null;
  status: Status;
  createdBy: string | null;
}

export interface UpdateTrainingTypeData {
  name?: string;
  description?: string | null;
  status?: Status;
  updatedBy: string | null;
}

export class TrainingTypesRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(
    query: ListTrainingTypesQuery,
  ): Promise<{ rows: TrainingTypeWithCount[]; total: number }> {
    const where: Prisma.TrainingTypeWhereInput = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.search) where.name = { contains: query.search, mode: "insensitive" };

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await Promise.all([
      this.db.trainingType.findMany({
        where,
        include: trainingTypeInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      this.db.trainingType.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string, includeDeleted = true): Promise<TrainingTypeWithCount | null> {
    return this.db.trainingType.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: trainingTypeInclude,
    });
  }

  async findIdByName(name: string, excludeId?: string): Promise<string | null> {
    const row = await this.db.trainingType.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  create(input: PersistTrainingTypeInput): Promise<TrainingTypeWithCount> {
    return this.db.trainingType.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        status: input.status,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
      },
      include: trainingTypeInclude,
    });
  }

  update(id: string, data: UpdateTrainingTypeData): Promise<TrainingTypeWithCount> {
    return this.db.trainingType.update({
      where: { id },
      data,
      include: trainingTypeInclude,
    });
  }

  async softDelete(id: string, deletedBy: string | null): Promise<void> {
    await this.db.trainingType.update({
      where: { id },
      data: { deletedAt: new Date(), status: "INACTIVE", updatedBy: deletedBy },
    });
  }
}
