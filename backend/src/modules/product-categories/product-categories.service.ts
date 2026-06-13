import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { Conflict, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import { generateUniqueCode } from "../../lib/codes.js";
import type { ActorContext } from "../users/users.service.js";
import { ProductCategoriesRepository } from "./product-categories.repository.js";
import { toProductCategoryDto } from "./product-categories.types.js";
import type {
  CreateProductCategoryInput,
  ListProductCategoriesQuery,
  ProductCategoryDto,
  UpdateProductCategoryInput,
} from "./product-categories.types.js";

const MODULE = "product-categories";

export class ProductCategoriesService {
  private readonly repo: ProductCategoriesRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new ProductCategoriesRepository(prisma);
  }

  async list(
    query: ListProductCategoriesQuery,
  ): Promise<{ data: ProductCategoryDto[]; meta: { pagination: PaginationMeta } }> {
    const { rows, total } = await this.repo.list(query);
    return {
      data: rows.map(toProductCategoryDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async getById(id: string): Promise<ProductCategoryDto> {
    const category = await this.repo.findById(id, false);
    if (!category) throw NotFound("Product category not found");
    return toProductCategoryDto(category);
  }

  async create(input: CreateProductCategoryInput, actor: ActorContext): Promise<ProductCategoryDto> {
    await this.assertNameAvailable(input.name);
    const code = await generateUniqueCode("CAT", (c) => this.repo.codeExists(c));

    const category = await this.repo.create({
      code,
      name: input.name,
      description: input.description ?? null,
      status: input.status,
      createdBy: actor.userId,
    });

    const dto = toProductCategoryDto(category);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PRODUCT_CATEGORY_CREATE,
      module: MODULE,
      recordId: dto.id,
      newData: dto,
      ipAddress: actor.ip,
    });
    return dto;
  }

  async update(
    id: string,
    input: UpdateProductCategoryInput,
    actor: ActorContext,
  ): Promise<ProductCategoryDto> {
    const existing = await this.repo.findById(id, false);
    if (!existing) throw NotFound("Product category not found");
    if (input.name) await this.assertNameAvailable(input.name, id);

    const updated = await this.repo.update(id, {
      name: input.name,
      description: input.description,
      status: input.status,
      updatedBy: actor.userId,
    });

    const before = toProductCategoryDto(existing);
    const after = toProductCategoryDto(updated);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PRODUCT_CATEGORY_UPDATE,
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
    if (!existing) throw NotFound("Product category not found");

    const activeProducts = await this.repo.activeProductCount(id);
    if (activeProducts > 0) {
      throw Conflict("Cannot delete a category that still has active products");
    }

    await this.repo.softDelete(id, actor.userId);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PRODUCT_CATEGORY_DELETE,
      module: MODULE,
      recordId: id,
      oldData: toProductCategoryDto(existing),
      ipAddress: actor.ip,
    });
  }

  // --- helpers -------------------------------------------------------------

  private async assertNameAvailable(name: string, excludeId?: string): Promise<void> {
    if (await this.repo.findIdByName(name, excludeId)) {
      throw Conflict("A product category with this name already exists");
    }
  }
}
