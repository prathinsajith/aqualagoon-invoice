import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { BadRequest, Conflict, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { ActorContext } from "../users/users.service.js";
import { BatchesRepository } from "./batches.repository.js";
import { toBatchDto } from "./batches.types.js";
import type {
  BatchDto,
  CreateBatchInput,
  ListBatchesQuery,
  UpdateBatchInput,
} from "./batches.types.js";

const MODULE = "batches";

export class BatchesService {
  private readonly repo: BatchesRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new BatchesRepository(prisma);
  }

  async list(
    query: ListBatchesQuery,
  ): Promise<{ data: BatchDto[]; meta: { pagination: PaginationMeta } }> {
    const { rows, total } = await this.repo.list(query);
    return {
      data: rows.map(toBatchDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async getById(id: string): Promise<BatchDto> {
    const batch = await this.repo.findById(id);
    if (!batch) throw NotFound("Batch not found");
    return toBatchDto(batch);
  }

  async create(input: CreateBatchInput, actor: ActorContext): Promise<BatchDto> {
    await this.assertProgramExists(input.trainingProgramId);
    if (input.trainerId) await this.assertTrainer(input.trainerId);

    const batch = await this.repo.create({
      trainingProgramId: input.trainingProgramId,
      trainerId: input.trainerId ?? null,
      name: input.name,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      capacity: input.capacity,
      status: input.status,
      createdBy: actor.userId,
    });

    const dto = toBatchDto(batch);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.BATCH_CREATE,
      module: MODULE,
      recordId: dto.id,
      newData: dto,
      ipAddress: actor.ip,
    });
    return dto;
  }

  async update(id: string, input: UpdateBatchInput, actor: ActorContext): Promise<BatchDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw NotFound("Batch not found");

    if (input.trainingProgramId) await this.assertProgramExists(input.trainingProgramId);
    if (input.trainerId) await this.assertTrainer(input.trainerId);

    const updated = await this.repo.update(id, {
      trainingProgramId: input.trainingProgramId,
      trainerId: input.trainerId,
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      startDate: input.startDate,
      endDate: input.endDate,
      capacity: input.capacity,
      status: input.status,
      updatedBy: actor.userId,
      // currentStrength is never accepted from the client.
    });

    const before = toBatchDto(existing);
    const after = toBatchDto(updated);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.BATCH_UPDATE,
      module: MODULE,
      recordId: id,
      oldData: before,
      newData: after,
      ipAddress: actor.ip,
    });

    // Record trainer assignment changes separately for traceability.
    if (input.trainerId !== undefined && (input.trainerId ?? null) !== existing.trainerId) {
      await writeAudit(this.prisma, {
        userId: actor.userId,
        action: AuditAction.TRAINER_ASSIGNED,
        module: MODULE,
        recordId: id,
        oldData: { trainerId: existing.trainerId },
        newData: { trainerId: input.trainerId ?? null },
        ipAddress: actor.ip,
      });
    }
    return after;
  }

  async remove(id: string, actor: ActorContext): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw NotFound("Batch not found");
    if (existing._count.enrollments > 0) {
      throw Conflict("Cannot delete a batch that has enrollments");
    }

    await this.repo.hardDelete(id);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.BATCH_DELETE,
      module: MODULE,
      recordId: id,
      oldData: toBatchDto(existing),
      ipAddress: actor.ip,
    });
  }

  private async assertProgramExists(programId: string): Promise<void> {
    if (!(await this.repo.findProgramId(programId))) {
      throw BadRequest("Training program not found");
    }
  }

  private async assertTrainer(userId: string): Promise<void> {
    if (!(await this.repo.isTrainer(userId))) {
      throw BadRequest("Assigned user must be an existing trainer");
    }
  }
}
