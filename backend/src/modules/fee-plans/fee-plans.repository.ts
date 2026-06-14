import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { toSkipTake } from "../../lib/pagination.js";
import { feePlanInclude } from "./fee-plans.types.js";
import type { ListFeePlansQuery, FeePlanWithRelations } from "./fee-plans.types.js";

type DurationType = "MONTH" | "QUARTER" | "YEAR" | "CUSTOM";
type Status = "ACTIVE" | "INACTIVE";

export interface PersistFeePlanInput {
  trainingProgramId: string;
  name: string;
  durationType: DurationType;
  durationDays: number;
  amount: number;
  description?: string | null;
  status: Status;
  createdBy: string | null;
}

export interface UpdateFeePlanData {
  trainingProgramId?: string;
  name?: string;
  durationType?: DurationType;
  durationDays?: number;
  amount?: number;
  description?: string | null;
  status?: Status;
  updatedBy: string | null;
}

export class FeePlansRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(query: ListFeePlansQuery): Promise<{ rows: FeePlanWithRelations[]; total: number }> {
    const where: Prisma.FeePlanWhereInput = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.trainingProgramId) where.trainingProgramId = query.trainingProgramId;
    if (query.search) where.name = { contains: query.search, mode: "insensitive" };

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await Promise.all([
      this.db.feePlan.findMany({
        where,
        include: feePlanInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      this.db.feePlan.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string, includeDeleted = true): Promise<FeePlanWithRelations | null> {
    return this.db.feePlan.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: feePlanInclude,
    });
  }

  async findIdByName(name: string, excludeId?: string): Promise<string | null> {
    const row = await this.db.feePlan.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async findTrainingProgramId(id: string): Promise<string | null> {
    const row = await this.db.trainingProgram.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  create(input: PersistFeePlanInput): Promise<FeePlanWithRelations> {
    return this.db.feePlan.create({
      data: {
        trainingProgramId: input.trainingProgramId,
        name: input.name,
        durationType: input.durationType,
        durationDays: input.durationDays,
        amount: new Prisma.Decimal(input.amount),
        description: input.description ?? null,
        status: input.status,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
      },
      include: feePlanInclude,
    });
  }

  update(id: string, data: UpdateFeePlanData): Promise<FeePlanWithRelations> {
    const { amount, ...rest } = data;
    return this.db.feePlan.update({
      where: { id },
      data: {
        ...rest,
        ...(amount !== undefined ? { amount: new Prisma.Decimal(amount) } : {}),
      },
      include: feePlanInclude,
    });
  }

  async softDelete(id: string, deletedBy: string | null): Promise<void> {
    await this.db.feePlan.update({
      where: { id },
      data: { deletedAt: new Date(), status: "INACTIVE", updatedBy: deletedBy },
    });
  }
}
