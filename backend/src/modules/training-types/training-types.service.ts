import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { Conflict, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { ActorContext } from "../users/users.service.js";
import { TrainingTypesRepository } from "./training-types.repository.js";
import { toTrainingTypeDto } from "./training-types.types.js";
import type {
  CreateTrainingTypeInput,
  ListTrainingTypesQuery,
  TrainingTypeDto,
  UpdateTrainingTypeInput,
} from "./training-types.types.js";

const MODULE = "training-types";

export class TrainingTypesService {
  private readonly repo: TrainingTypesRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new TrainingTypesRepository(prisma);
  }

  async list(
    query: ListTrainingTypesQuery,
  ): Promise<{ data: TrainingTypeDto[]; meta: { pagination: PaginationMeta } }> {
    const { rows, total } = await this.repo.list(query);
    return {
      data: rows.map(toTrainingTypeDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async getById(id: string): Promise<TrainingTypeDto> {
    const trainingType = await this.repo.findById(id, false);
    if (!trainingType) throw NotFound("Training type not found");
    return toTrainingTypeDto(trainingType);
  }

  async create(input: CreateTrainingTypeInput, actor: ActorContext): Promise<TrainingTypeDto> {
    await this.assertNameAvailable(input.name);

    const trainingType = await this.repo.create({
      name: input.name,
      description: input.description ?? null,
      status: input.status,
      createdBy: actor.userId,
    });

    const dto = toTrainingTypeDto(trainingType);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.TRAINING_TYPE_CREATE,
      module: MODULE,
      recordId: dto.id,
      newData: dto,
      ipAddress: actor.ip,
    });
    return dto;
  }

  async update(
    id: string,
    input: UpdateTrainingTypeInput,
    actor: ActorContext,
  ): Promise<TrainingTypeDto> {
    const existing = await this.repo.findById(id, false);
    if (!existing) throw NotFound("Training type not found");
    if (input.name) await this.assertNameAvailable(input.name, id);

    const updated = await this.repo.update(id, {
      name: input.name,
      description: input.description,
      status: input.status,
      updatedBy: actor.userId,
    });

    const before = toTrainingTypeDto(existing);
    const after = toTrainingTypeDto(updated);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.TRAINING_TYPE_UPDATE,
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
    if (!existing) throw NotFound("Training type not found");
    if (existing._count.programs > 0) {
      throw Conflict("Cannot delete a training type that still has programs");
    }

    await this.repo.softDelete(id, actor.userId);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.TRAINING_TYPE_DELETE,
      module: MODULE,
      recordId: id,
      oldData: toTrainingTypeDto(existing),
      ipAddress: actor.ip,
    });
  }

  private async assertNameAvailable(name: string, excludeId?: string): Promise<void> {
    if (await this.repo.findIdByName(name, excludeId)) {
      throw Conflict("A training type with this name already exists");
    }
  }
}
