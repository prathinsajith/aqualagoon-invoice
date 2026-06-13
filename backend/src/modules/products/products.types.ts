import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  createProductBody,
  listProductsQuery,
  productSchema,
  updateProductBody,
} from "./products.schema.js";

export type ProductDto = z.infer<typeof productSchema>;
export type CreateProductInput = z.infer<typeof createProductBody>;
export type UpdateProductInput = z.infer<typeof updateProductBody>;
export type ListProductsQuery = z.infer<typeof listProductsQuery>;

/** Pulls the parent category (id + name) for display. */
export const productInclude = {
  category: { select: { id: true, name: true } },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export function toProductDto(p: ProductWithRelations): ProductDto {
  return {
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    categoryId: p.categoryId,
    category: { id: p.category.id, name: p.category.name },
    name: p.name,
    description: p.description,
    purchasePrice: p.purchasePrice.toNumber(),
    sellingPrice: p.sellingPrice.toNumber(),
    taxPercentage: p.taxPercentage.toNumber(),
    imageUrl: p.imageUrl,
    stockQuantity: p.stockQuantity,
    minimumStock: p.minimumStock,
    status: p.status,
    createdBy: p.createdBy,
    updatedBy: p.updatedBy,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    deletedAt: p.deletedAt,
  };
}
