import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { BadRequest, Conflict, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { ActorContext } from "../users/users.service.js";
import { TrainingProgramsRepository } from "./training-programs.repository.js";
import { toTrainingProgramDto } from "./training-programs.types.js";
import type {
  CreateTrainingProgramInput,
  ListTrainingProgramsQuery,
  TrainingProgramDto,
  UpdateTrainingProgramInput,
} from "./training-programs.types.js";

const MODULE = "training-programs";

export class TrainingProgramsService {
  private readonly repo: TrainingProgramsRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new TrainingProgramsRepository(prisma);
  }

  async list(
    query: ListTrainingProgramsQuery,
  ): Promise<{ data: TrainingProgramDto[]; meta: { pagination: PaginationMeta } }> {
    const { rows, total } = await this.repo.list(query);
    return {
      data: rows.map(toTrainingProgramDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async getById(id: string): Promise<TrainingProgramDto> {
    const program = await this.repo.findById(id, false);
    if (!program) throw NotFound("Training program not found");
    return toTrainingProgramDto(program);
  }

  async create(
    input: CreateTrainingProgramInput,
    actor: ActorContext,
  ): Promise<TrainingProgramDto> {
    await this.assertNameAvailable(input.name);
    await this.assertTrainingTypeExists(input.trainingTypeId);

    const program = await this.repo.create({
      trainingTypeId: input.trainingTypeId,
      name: input.name,
      description: input.description ?? null,
      durationType: input.durationType,
      durationValue: input.durationValue,
      defaultFee: input.defaultFee,
      status: input.status,
      createdBy: actor.userId,
    });

    const dto = toTrainingProgramDto(program);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.TRAINING_PROGRAM_CREATE,
      module: MODULE,
      recordId: dto.id,
      newData: dto,
      ipAddress: actor.ip,
    });
    return dto;
  }

  async update(
    id: string,
    input: UpdateTrainingProgramInput,
    actor: ActorContext,
  ): Promise<TrainingProgramDto> {
    const existing = await this.repo.findById(id, false);
    if (!existing) throw NotFound("Training program not found");
    if (input.name) await this.assertNameAvailable(input.name, id);
    if (input.trainingTypeId) await this.assertTrainingTypeExists(input.trainingTypeId);

    const updated = await this.repo.update(id, {
      trainingTypeId: input.trainingTypeId,
      name: input.name,
      description: input.description,
      durationType: input.durationType,
      durationValue: input.durationValue,
      defaultFee: input.defaultFee,
      status: input.status,
      updatedBy: actor.userId,
    });

    const before = toTrainingProgramDto(existing);
    const after = toTrainingProgramDto(updated);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.TRAINING_PROGRAM_UPDATE,
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
    if (!existing) throw NotFound("Training program not found");
    if (existing._count.feePlans > 0) {
      throw Conflict("Cannot delete a training program that still has fee plans");
    }
    if (existing._count.batches > 0) {
      throw Conflict("Cannot delete a training program that has batches");
    }

    await this.repo.softDelete(id, actor.userId);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.TRAINING_PROGRAM_DELETE,
      module: MODULE,
      recordId: id,
      oldData: toTrainingProgramDto(existing),
      ipAddress: actor.ip,
    });
  }

  private async assertNameAvailable(name: string, excludeId?: string): Promise<void> {
    if (await this.repo.findIdByName(name, excludeId)) {
      throw Conflict("A training program with this name already exists");
    }
  }

  private async assertTrainingTypeExists(trainingTypeId: string): Promise<void> {
    if (!(await this.repo.findTrainingTypeId(trainingTypeId))) {
      throw BadRequest("The referenced training type does not exist");
    }
  }
}
