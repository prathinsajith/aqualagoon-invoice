import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { toSkipTake } from "../../lib/pagination.js";
import { paymentMethodInclude } from "./payment-methods.types.js";
import type { ListPaymentMethodsQuery, PaymentMethodWithCount } from "./payment-methods.types.js";

export interface PersistPaymentMethodInput {
  name: string;
  description?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdBy: string | null;
}

export interface UpdatePaymentMethodData {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  displayOrder?: number;
  updatedBy: string | null;
}

export class PaymentMethodsRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(
    query: ListPaymentMethodsQuery,
  ): Promise<{ rows: PaymentMethodWithCount[]; total: number }> {
    const where: Prisma.PaymentMethodWhereInput = { deletedAt: null };
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) where.name = { contains: query.search, mode: "insensitive" };

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await Promise.all([
      this.db.paymentMethod.findMany({
        where,
        include: paymentMethodInclude,
        orderBy: [{ [query.sortBy]: query.sortOrder }, { name: "asc" }],
        skip,
        take,
      }),
      this.db.paymentMethod.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string, includeDeleted = true): Promise<PaymentMethodWithCount | null> {
    return this.db.paymentMethod.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: paymentMethodInclude,
    });
  }

  async findIdByName(name: string, excludeId?: string): Promise<string | null> {
    const row = await this.db.paymentMethod.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  create(input: PersistPaymentMethodInput): Promise<PaymentMethodWithCount> {
    return this.db.paymentMethod.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        isActive: input.isActive,
        displayOrder: input.displayOrder,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
      },
      include: paymentMethodInclude,
    });
  }

  update(id: string, data: UpdatePaymentMethodData): Promise<PaymentMethodWithCount> {
    return this.db.paymentMethod.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        displayOrder: data.displayOrder,
        updatedBy: data.updatedBy,
      },
      include: paymentMethodInclude,
    });
  }

  async softDelete(id: string, deletedBy: string | null): Promise<void> {
    await this.db.paymentMethod.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
    });
  }

  /** Persists a new drag order: displayOrder = position in `orderedIds`. */
  async reorder(orderedIds: string[]): Promise<void> {
    await this.db.$transaction(
      orderedIds.map((id, index) =>
        this.db.paymentMethod.update({ where: { id }, data: { displayOrder: index } }),
      ),
    );
  }
}
