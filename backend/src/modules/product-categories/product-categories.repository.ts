import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { toSkipTake } from "../../lib/pagination.js";
import { productCategoryInclude } from "./product-categories.types.js";
import type {
  ListProductCategoriesQuery,
  ProductCategoryWithCount,
} from "./product-categories.types.js";

export interface PersistCategoryInput {
  code: string;
  name: string;
  description?: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdBy: string | null;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string | null;
  status?: "ACTIVE" | "INACTIVE";
  updatedBy: string | null;
}

export class ProductCategoriesRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(
    query: ListProductCategoriesQuery,
  ): Promise<{ rows: ProductCategoryWithCount[]; total: number }> {
    const where: Prisma.ProductCategoryWhereInput = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.search) {
      const contains = { contains: query.search, mode: "insensitive" as const };
      where.OR = [{ name: contains }, { code: contains }];
    }

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await Promise.all([
      this.db.productCategory.findMany({
        where,
        include: productCategoryInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      this.db.productCategory.count({ where }),
    ]);

    return { rows, total };
  }

  findById(id: string, includeDeleted = true): Promise<ProductCategoryWithCount | null> {
    return this.db.productCategory.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: productCategoryInclude,
    });
  }

  /** Looks for a non-deleted category with this name (for uniqueness checks). */
  async findIdByName(name: string, excludeId?: string): Promise<string | null> {
    const row = await this.db.productCategory.findFirst({
      // Case-insensitive so "Drinks" and "drinks" aren't treated as distinct.
      where: {
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async codeExists(code: string): Promise<boolean> {
    const row = await this.db.productCategory.findUnique({ where: { code }, select: { id: true } });
    return !!row;
  }

  /** Counts non-deleted products in a category (blocks deletion when > 0). */
  activeProductCount(categoryId: string): Promise<number> {
    return this.db.product.count({ where: { categoryId, deletedAt: null } });
  }

  create(input: PersistCategoryInput): Promise<ProductCategoryWithCount> {
    return this.db.productCategory.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description ?? null,
        status: input.status,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
      },
      include: productCategoryInclude,
    });
  }

  update(id: string, data: UpdateCategoryData): Promise<ProductCategoryWithCount> {
    return this.db.productCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        updatedBy: data.updatedBy,
      },
      include: productCategoryInclude,
    });
  }

  async softDelete(id: string, deletedBy: string | null): Promise<void> {
    await this.db.productCategory.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: deletedBy },
    });
  }
}
