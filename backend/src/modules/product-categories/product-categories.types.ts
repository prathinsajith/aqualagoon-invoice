import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  createProductCategoryBody,
  listProductCategoriesQuery,
  productCategorySchema,
  updateProductCategoryBody,
} from "./product-categories.schema.js";

export type ProductCategoryDto = z.infer<typeof productCategorySchema>;
export type CreateProductCategoryInput = z.infer<typeof createProductCategoryBody>;
export type UpdateProductCategoryInput = z.infer<typeof updateProductCategoryBody>;
export type ListProductCategoriesQuery = z.infer<typeof listProductCategoriesQuery>;

/** Pulls a count of the category's non-deleted products. */
export const productCategoryInclude = {
  _count: { select: { products: { where: { deletedAt: null } } } },
} satisfies Prisma.ProductCategoryInclude;

export type ProductCategoryWithCount = Prisma.ProductCategoryGetPayload<{
  include: typeof productCategoryInclude;
}>;

export function toProductCategoryDto(c: ProductCategoryWithCount): ProductCategoryDto {
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    description: c.description,
    status: c.status,
    productsCount: c._count.products,
    createdBy: c.createdBy,
    updatedBy: c.updatedBy,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    deletedAt: c.deletedAt,
  };
}
