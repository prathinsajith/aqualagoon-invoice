import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { BadRequest, Conflict, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { ActorContext } from "../users/users.service.js";
import { PaymentMethodsRepository } from "./payment-methods.repository.js";
import { toPaymentMethodDto } from "./payment-methods.types.js";
import type {
  CreatePaymentMethodInput,
  ListPaymentMethodsQuery,
  PaymentMethodDto,
  UpdatePaymentMethodInput,
} from "./payment-methods.types.js";

const MODULE = "payment-methods";

export class PaymentMethodsService {
  private readonly repo: PaymentMethodsRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new PaymentMethodsRepository(prisma);
  }

  async list(
    query: ListPaymentMethodsQuery,
  ): Promise<{ data: PaymentMethodDto[]; meta: { pagination: PaginationMeta } }> {
    const { rows, total } = await this.repo.list(query);
    return {
      data: rows.map(toPaymentMethodDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async getById(id: string): Promise<PaymentMethodDto> {
    const method = await this.repo.findById(id, false);
    if (!method) throw NotFound("Payment method not found");
    return toPaymentMethodDto(method);
  }

  async create(input: CreatePaymentMethodInput, actor: ActorContext): Promise<PaymentMethodDto> {
    await this.assertNameAvailable(input.name);
    const method = await this.repo.create({
      name: input.name,
      description: input.description ?? null,
      isActive: input.isActive,
      displayOrder: input.displayOrder,
      createdBy: actor.userId,
    });
    const dto = toPaymentMethodDto(method);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PAYMENT_METHOD_CREATE,
      module: MODULE,
      recordId: dto.id,
      newData: dto,
      ipAddress: actor.ip,
    });
    return dto;
  }

  async update(
    id: string,
    input: UpdatePaymentMethodInput,
    actor: ActorContext,
  ): Promise<PaymentMethodDto> {
    const existing = await this.repo.findById(id, false);
    if (!existing) throw NotFound("Payment method not found");
    if (input.name) await this.assertNameAvailable(input.name, id);

    const updated = await this.repo.update(id, {
      name: input.name,
      description: input.description,
      isActive: input.isActive,
      displayOrder: input.displayOrder,
      updatedBy: actor.userId,
    });

    const before = toPaymentMethodDto(existing);
    const after = toPaymentMethodDto(updated);
    // An isActive toggle is logged as a dedicated activate/deactivate event.
    const action =
      input.isActive !== undefined && input.isActive !== existing.isActive
        ? input.isActive
          ? AuditAction.PAYMENT_METHOD_ACTIVATE
          : AuditAction.PAYMENT_METHOD_DEACTIVATE
        : AuditAction.PAYMENT_METHOD_UPDATE;
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

  /** Saves a new top-to-bottom display order for the given method ids. */
  async reorder(orderedIds: string[], actor: ActorContext): Promise<PaymentMethodDto[]> {
    const uniqueIds = [...new Set(orderedIds)];
    const found = await this.prisma.paymentMethod.count({
      where: { id: { in: uniqueIds }, deletedAt: null },
    });
    if (found !== uniqueIds.length) throw BadRequest("One or more payment methods do not exist");

    await this.repo.reorder(uniqueIds);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PAYMENT_METHOD_UPDATE,
      module: MODULE,
      recordId: null,
      newData: { reordered: uniqueIds },
      ipAddress: actor.ip,
    });
    const { rows } = await this.repo.list({
      page: 1,
      limit: 100,
      sortBy: "displayOrder",
      sortOrder: "asc",
    });
    return rows.map(toPaymentMethodDto);
  }

  async remove(id: string, actor: ActorContext): Promise<void> {
    const existing = await this.repo.findById(id, false);
    if (!existing) throw NotFound("Payment method not found");
    if (existing._count.payments > 0) {
      throw Conflict("Cannot delete a payment method that has recorded payments");
    }

    await this.repo.softDelete(id, actor.userId);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PAYMENT_METHOD_DELETE,
      module: MODULE,
      recordId: id,
      oldData: toPaymentMethodDto(existing),
      ipAddress: actor.ip,
    });
  }

  private async assertNameAvailable(name: string, excludeId?: string): Promise<void> {
    if (await this.repo.findIdByName(name, excludeId)) {
      throw Conflict("A payment method with this name already exists");
    }
  }
}
