import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { BadRequest, Conflict, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { ActorContext } from "../users/users.service.js";
import { PassTypesRepository } from "./pass-types.repository.js";
import { toPassTypeDto } from "./pass-types.types.js";
import type {
  CreatePassTypeInput,
  ListPassTypesQuery,
  PassTypeDto,
  UpdatePassTypeInput,
} from "./pass-types.types.js";

const MODULE = "pass-types";

export class PassTypesService {
  private readonly repo: PassTypesRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new PassTypesRepository(prisma);
  }

  async list(
    query: ListPassTypesQuery,
  ): Promise<{ data: PassTypeDto[]; meta: { pagination: PaginationMeta } }> {
    const { rows, total } = await this.repo.list(query);
    return {
      data: rows.map(toPassTypeDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async getById(id: string): Promise<PassTypeDto> {
    const passType = await this.repo.findById(id, false);
    if (!passType) throw NotFound("Pass type not found");
    return toPassTypeDto(passType);
  }

  async create(input: CreatePassTypeInput, actor: ActorContext): Promise<PassTypeDto> {
    await this.assertNameAvailable(input.name);
    if (input.entryType === "LIMITED" && !input.allowedEntries) {
      throw BadRequest("Allowed entries is required for limited-entry passes");
    }

    const passType = await this.repo.create({
      type: input.type,
      name: input.name,
      description: input.description ?? null,
      durationType: input.durationType,
      durationValue: input.durationValue,
      entryType: input.entryType,
      // Unlimited passes never track per-entry counts.
      allowedEntries: input.entryType === "LIMITED" ? (input.allowedEntries ?? null) : null,
      maxEntriesPerDay: input.maxEntriesPerDay ?? null,
      price: input.price,
      discountType: input.discountType,
      discountValue: input.discountValue,
      status: input.status,
      createdBy: actor.userId,
    });

    const dto = toPassTypeDto(passType);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PASS_TYPE_CREATE,
      module: MODULE,
      recordId: dto.id,
      newData: dto,
      ipAddress: actor.ip,
    });
    return dto;
  }

  async update(id: string, input: UpdatePassTypeInput, actor: ActorContext): Promise<PassTypeDto> {
    const existing = await this.repo.findById(id, false);
    if (!existing) throw NotFound("Pass type not found");
    if (input.name) await this.assertNameAvailable(input.name, id);

    const entryType = input.entryType ?? existing.entryType;
    if (entryType === "LIMITED") {
      const allowed = input.allowedEntries ?? existing.allowedEntries;
      if (!allowed) throw BadRequest("Allowed entries is required for limited-entry passes");
    }

    const updated = await this.repo.update(id, {
      type: input.type,
      name: input.name,
      description: input.description,
      durationType: input.durationType,
      durationValue: input.durationValue,
      entryType: input.entryType,
      // Clear entry caps when switching to unlimited.
      allowedEntries: entryType === "UNLIMITED" ? null : input.allowedEntries,
      maxEntriesPerDay: input.maxEntriesPerDay,
      price: input.price,
      discountType: input.discountType,
      discountValue: input.discountValue,
      status: input.status,
      updatedBy: actor.userId,
    });

    const before = toPassTypeDto(existing);
    const after = toPassTypeDto(updated);
    const action =
      input.status !== undefined && input.status !== existing.status
        ? input.status === "ACTIVE"
          ? AuditAction.PASS_TYPE_ACTIVATE
          : AuditAction.PASS_TYPE_DEACTIVATE
        : AuditAction.PASS_TYPE_UPDATE;
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action,
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
    if (!existing) throw NotFound("Pass type not found");
    if (existing._count.userPasses > 0) {
      throw Conflict("Cannot delete a pass type that already has issued passes");
    }

    await this.repo.softDelete(id, actor.userId);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PASS_TYPE_DELETE,
      module: MODULE,
      recordId: id,
      oldData: toPassTypeDto(existing),
      ipAddress: actor.ip,
    });
  }

  private async assertNameAvailable(name: string, excludeId?: string): Promise<void> {
    if (await this.repo.findIdByName(name, excludeId)) {
      throw Conflict("A pass type with this name already exists");
    }
  }
}
