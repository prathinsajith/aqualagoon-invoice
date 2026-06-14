import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { BadRequest, Conflict, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { ActorContext } from "../users/users.service.js";
import { FeePlansRepository } from "./fee-plans.repository.js";
import { toFeePlanDto } from "./fee-plans.types.js";
import type {
  CreateFeePlanInput,
  ListFeePlansQuery,
  FeePlanDto,
  UpdateFeePlanInput,
} from "./fee-plans.types.js";

const MODULE = "fee-plans";

export class FeePlansService {
  private readonly repo: FeePlansRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new FeePlansRepository(prisma);
  }

  async list(
    query: ListFeePlansQuery,
  ): Promise<{ data: FeePlanDto[]; meta: { pagination: PaginationMeta } }> {
    const { rows, total } = await this.repo.list(query);
    return {
      data: rows.map(toFeePlanDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async getById(id: string): Promise<FeePlanDto> {
    const feePlan = await this.repo.findById(id, false);
    if (!feePlan) throw NotFound("Fee plan not found");
    return toFeePlanDto(feePlan);
  }

  async create(input: CreateFeePlanInput, actor: ActorContext): Promise<FeePlanDto> {
    await this.assertNameAvailable(input.name);
    await this.assertProgramExists(input.trainingProgramId);

    const feePlan = await this.repo.create({
      trainingProgramId: input.trainingProgramId,
      name: input.name,
      durationType: input.durationType,
      amount: input.amount,
      description: input.description ?? null,
      status: input.status,
      createdBy: actor.userId,
    });

    const dto = toFeePlanDto(feePlan);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.FEE_PLAN_CREATE,
      module: MODULE,
      recordId: dto.id,
      newData: dto,
      ipAddress: actor.ip,
    });
    return dto;
  }

  async update(id: string, input: UpdateFeePlanInput, actor: ActorContext): Promise<FeePlanDto> {
    const existing = await this.repo.findById(id, false);
    if (!existing) throw NotFound("Fee plan not found");
    if (input.name) await this.assertNameAvailable(input.name, id);
    if (input.trainingProgramId) await this.assertProgramExists(input.trainingProgramId);

    const updated = await this.repo.update(id, {
      trainingProgramId: input.trainingProgramId,
      name: input.name,
      durationType: input.durationType,
      amount: input.amount,
      description: input.description,
      status: input.status,
      updatedBy: actor.userId,
    });

    const before = toFeePlanDto(existing);
    const after = toFeePlanDto(updated);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.FEE_PLAN_UPDATE,
      module: MODULE,
      recordId: id,
      oldData: before,
      newData: after,
      ipAddress: actor.ip,
    });
    return after;
  }

  async remove(id: string, actor: ActorContext): Promise<void> {
    const existing = await this.repo.findById(id, false);
    if (!existing) throw NotFound("Fee plan not found");
    if (existing._count.studentFees > 0) {
      throw Conflict("Cannot delete a fee plan that has student fees");
    }
    if (existing._count.enrollments > 0) {
      throw Conflict("Cannot delete a fee plan that has enrollments");
    }

    await this.repo.softDelete(id, actor.userId);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.FEE_PLAN_DELETE,
      module: MODULE,
      recordId: id,
      oldData: toFeePlanDto(existing),
      ipAddress: actor.ip,
    });
  }

  private async assertNameAvailable(name: string, excludeId?: string): Promise<void> {
    if (await this.repo.findIdByName(name, excludeId)) {
      throw Conflict("A fee plan with this name already exists");
    }
  }

  private async assertProgramExists(trainingProgramId: string): Promise<void> {
    if (!(await this.repo.findTrainingProgramId(trainingProgramId))) {
      throw BadRequest("The referenced training program does not exist");
    }
  }
}
