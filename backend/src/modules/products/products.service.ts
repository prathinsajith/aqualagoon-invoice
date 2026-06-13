import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { BadRequest, Conflict, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import { generateUniqueCode } from "../../lib/codes.js";
import type { StorageDriver } from "../../lib/storage/index.js";
import type { ActorContext } from "../users/users.service.js";
import { ProductsRepository } from "./products.repository.js";
import { toProductDto } from "./products.types.js";
import type {
  CreateProductInput,
  ListProductsQuery,
  ProductDto,
  UpdateProductInput,
} from "./products.types.js";

const MODULE = "products";

export class ProductsService {
  private readonly repo: ProductsRepository;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: StorageDriver,
  ) {
    this.repo = new ProductsRepository(prisma);
  }

  async list(
    query: ListProductsQuery,
  ): Promise<{ data: ProductDto[]; meta: { pagination: PaginationMeta } }> {
    const { rows, total } = await this.repo.list(query);
    return {
      data: rows.map(toProductDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async getById(id: string): Promise<ProductDto> {
    const product = await this.repo.findById(id);
    if (!product) throw NotFound("Product not found");
    return toProductDto(product);
  }

  async create(input: CreateProductInput, actor: ActorContext): Promise<ProductDto> {
    await this.assertCategoryUsable(input.categoryId);
    if (input.barcode) await this.assertBarcodeAvailable(input.barcode);
    const sku = await generateUniqueCode("SKU", (s) => this.repo.skuExists(s));

    const product = await this.repo.create({
      sku,
      barcode: input.barcode ?? null,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description ?? null,
      purchasePrice: input.purchasePrice,
      sellingPrice: input.sellingPrice,
      taxPercentage: input.taxPercentage,
      stockQuantity: input.stockQuantity,
      minimumStock: input.minimumStock,
      status: input.status,
      createdBy: actor.userId,
    });

    const dto = toProductDto(product);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PRODUCT_CREATE,
      module: MODULE,
      recordId: dto.id,
      newData: dto,
      ipAddress: actor.ip,
    });
    return dto;
  }

  async update(id: string, input: UpdateProductInput, actor: ActorContext): Promise<ProductDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw NotFound("Product not found");
    if (input.categoryId) await this.assertCategoryUsable(input.categoryId);
    if (input.barcode) await this.assertBarcodeAvailable(input.barcode, id);

    const updated = await this.repo.update(id, {
      barcode: input.barcode,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      purchasePrice: input.purchasePrice,
      sellingPrice: input.sellingPrice,
      taxPercentage: input.taxPercentage,
      stockQuantity: input.stockQuantity,
      minimumStock: input.minimumStock,
      status: input.status,
      updatedBy: actor.userId,
    });

    const before = toProductDto(existing);
    const after = toProductDto(updated);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PRODUCT_UPDATE,
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
    if (!existing) throw NotFound("Product not found");

    await this.repo.softDelete(id, actor.userId);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PRODUCT_DELETE,
      module: MODULE,
      recordId: id,
      oldData: toProductDto(existing),
      ipAddress: actor.ip,
    });
  }

  async restore(id: string, actor: ActorContext): Promise<ProductDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw NotFound("Product not found");
    if (!existing.deletedAt) throw BadRequest("Product is not archived");

    const restored = await this.repo.restore(id, actor.userId);
    const dto = toProductDto(restored);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PRODUCT_RESTORE,
      module: MODULE,
      recordId: id,
      newData: dto,
      ipAddress: actor.ip,
    });
    return dto;
  }

  /** Sets (or replaces) the product image, cleaning up the previous object. */
  async setImage(id: string, imageUrl: string, actor: ActorContext): Promise<ProductDto> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      // The uploaded object is now orphaned — best-effort cleanup.
      await this.storage.deleteByUrl(imageUrl).catch(() => {});
      throw NotFound("Product not found");
    }

    const updated = await this.repo.update(id, { imageUrl, updatedBy: actor.userId });
    if (existing.imageUrl && existing.imageUrl !== imageUrl) {
      await this.storage.deleteByUrl(existing.imageUrl).catch(() => {});
    }

    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PRODUCT_UPDATE,
      module: MODULE,
      recordId: id,
      newData: { imageUrl },
      ipAddress: actor.ip,
    });
    return toProductDto(updated);
  }

  /** Removes the product image and deletes the stored object. */
  async removeImage(id: string, actor: ActorContext): Promise<ProductDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw NotFound("Product not found");

    const updated = await this.repo.update(id, { imageUrl: null, updatedBy: actor.userId });
    if (existing.imageUrl) {
      await this.storage.deleteByUrl(existing.imageUrl).catch(() => {});
    }

    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PRODUCT_UPDATE,
      module: MODULE,
      recordId: id,
      newData: { imageUrl: null },
      ipAddress: actor.ip,
    });
    return toProductDto(updated);
  }

  // --- helpers -------------------------------------------------------------

  private async assertCategoryUsable(categoryId: string): Promise<void> {
    const category = await this.prisma.productCategory.findFirst({
      where: { id: categoryId, deletedAt: null },
      select: { id: true },
    });
    if (!category) throw BadRequest("Selected category does not exist");
  }

  private async assertBarcodeAvailable(barcode: string, excludeId?: string): Promise<void> {
    if (await this.repo.findIdByBarcode(barcode, excludeId)) {
      throw Conflict("A product with this barcode already exists");
    }
  }
}
