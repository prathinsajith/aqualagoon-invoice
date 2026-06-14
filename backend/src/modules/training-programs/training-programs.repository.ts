import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { toSkipTake } from "../../lib/pagination.js";
import { trainingProgramInclude } from "./training-programs.types.js";
import type {
  ListTrainingProgramsQuery,
  TrainingProgramWithRelations,
} from "./training-programs.types.js";

type DurationType = "MONTH" | "QUARTER" | "YEAR" | "CUSTOM";
type Status = "ACTIVE" | "INACTIVE";

export interface PersistTrainingProgramInput {
  trainingTypeId: string;
  name: string;
  description?: string | null;
  durationType: DurationType;
  durationValue: number;
  defaultFee: number;
  status: Status;
  createdBy: string | null;
}

export interface UpdateTrainingProgramData {
  trainingTypeId?: string;
  name?: string;
  description?: string | null;
  durationType?: DurationType;
  durationValue?: number;
  defaultFee?: number;
  status?: Status;
  updatedBy: string | null;
}

export class TrainingProgramsRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(
    query: ListTrainingProgramsQuery,
  ): Promise<{ rows: TrainingProgramWithRelations[]; total: number }> {
    const where: Prisma.TrainingProgramWhereInput = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.trainingTypeId) where.trainingTypeId = query.trainingTypeId;
    if (query.search) where.name = { contains: query.search, mode: "insensitive" };

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await Promise.all([
      this.db.trainingProgram.findMany({
        where,
        include: trainingProgramInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      this.db.trainingProgram.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string, includeDeleted = true): Promise<TrainingProgramWithRelations | null> {
    return this.db.trainingProgram.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: trainingProgramInclude,
    });
  }

  async findIdByName(name: string, excludeId?: string): Promise<string | null> {
    const row = await this.db.trainingProgram.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async findTrainingTypeId(id: string): Promise<string | null> {
    const row = await this.db.trainingType.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  create(input: PersistTrainingProgramInput): Promise<TrainingProgramWithRelations> {
    return this.db.trainingProgram.create({
      data: {
        trainingTypeId: input.trainingTypeId,
        name: input.name,
        description: input.description ?? null,
        durationType: input.durationType,
        durationValue: input.durationValue,
        defaultFee: new Prisma.Decimal(input.defaultFee),
        status: input.status,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
      },
      include: trainingProgramInclude,
    });
  }

  update(id: string, data: UpdateTrainingProgramData): Promise<TrainingProgramWithRelations> {
    const { defaultFee, ...rest } = data;
    return this.db.trainingProgram.update({
      where: { id },
      data: {
        ...rest,
        ...(defaultFee !== undefined ? { defaultFee: new Prisma.Decimal(defaultFee) } : {}),
      },
      include: trainingProgramInclude,
    });
  }

  async softDelete(id: string, deletedBy: string | null): Promise<void> {
    await this.db.trainingProgram.update({
      where: { id },
      data: { deletedAt: new Date(), status: "INACTIVE", updatedBy: deletedBy },
    });
  }
}
