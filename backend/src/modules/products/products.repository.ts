import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { toSkipTake } from "../../lib/pagination.js";
import { productInclude } from "./products.types.js";
import type { ListProductsQuery, ProductWithRelations } from "./products.types.js";

export interface PersistProductInput {
  sku: string;
  barcode?: string | null;
  categoryId: string;
  name: string;
  description?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  taxPercentage: number;
  stockQuantity: number;
  minimumStock: number;
  status: "ACTIVE" | "INACTIVE";
  createdBy: string | null;
}

export interface UpdateProductData {
  barcode?: string | null;
  categoryId?: string;
  name?: string;
  description?: string | null;
  purchasePrice?: number;
  sellingPrice?: number;
  taxPercentage?: number;
  stockQuantity?: number;
  minimumStock?: number;
  status?: "ACTIVE" | "INACTIVE";
  imageUrl?: string | null;
  updatedBy: string | null;
}

export class ProductsRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(query: ListProductsQuery): Promise<{ rows: ProductWithRelations[]; total: number }> {
    const where: Prisma.ProductWhereInput = {};

    if (query.onlyDeleted) where.deletedAt = { not: null };
    else if (!query.includeDeleted) where.deletedAt = null;

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;

    if (query.search) {
      const contains = { contains: query.search, mode: "insensitive" as const };
      where.OR = [{ name: contains }, { sku: contains }, { barcode: contains }];
    }

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await Promise.all([
      this.db.product.findMany({
        where,
        include: productInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      this.db.product.count({ where }),
    ]);

    return { rows, total };
  }

  findById(id: string, includeDeleted = true): Promise<ProductWithRelations | null> {
    return this.db.product.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: productInclude,
    });
  }

  async skuExists(sku: string): Promise<boolean> {
    const row = await this.db.product.findUnique({ where: { sku }, select: { id: true } });
    return !!row;
  }

  /** Any product (incl. archived) holding this barcode, excluding `excludeId`. */
  async findIdByBarcode(barcode: string, excludeId?: string): Promise<string | null> {
    const row = await this.db.product.findFirst({
      where: { barcode, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  create(input: PersistProductInput): Promise<ProductWithRelations> {
    return this.db.product.create({
      data: {
        sku: input.sku,
        barcode: input.barcode ?? null,
        categoryId: input.categoryId,
        name: input.name,
        description: input.description ?? null,
        purchasePrice: new Prisma.Decimal(input.purchasePrice),
        sellingPrice: new Prisma.Decimal(input.sellingPrice),
        taxPercentage: new Prisma.Decimal(input.taxPercentage),
        stockQuantity: input.stockQuantity,
        minimumStock: input.minimumStock,
        status: input.status,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
      },
      include: productInclude,
    });
  }

  update(id: string, data: UpdateProductData): Promise<ProductWithRelations> {
    const { purchasePrice, sellingPrice, taxPercentage, ...rest } = data;
    return this.db.product.update({
      where: { id },
      data: {
        ...rest,
        ...(purchasePrice !== undefined ? { purchasePrice: new Prisma.Decimal(purchasePrice) } : {}),
        ...(sellingPrice !== undefined ? { sellingPrice: new Prisma.Decimal(sellingPrice) } : {}),
        ...(taxPercentage !== undefined ? { taxPercentage: new Prisma.Decimal(taxPercentage) } : {}),
      },
      include: productInclude,
    });
  }

  async softDelete(id: string, deletedBy: string | null): Promise<void> {
    await this.db.product.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: deletedBy },
    });
  }

  restore(id: string, restoredBy: string | null): Promise<ProductWithRelations> {
    return this.db.product.update({
      where: { id },
      data: { deletedAt: null, updatedBy: restoredBy },
      include: productInclude,
    });
  }
}
