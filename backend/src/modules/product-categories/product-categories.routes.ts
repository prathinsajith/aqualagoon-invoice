import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { ProductCategoriesService } from "./product-categories.service.js";
import { createProductCategoriesController } from "./product-categories.controller.js";
import {
  categoryIdParams,
  createProductCategoryBody,
  listProductCategoriesQuery,
  productCategorySchema,
  updateProductCategoryBody,
} from "./product-categories.schema.js";

export async function productCategoriesRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createProductCategoriesController(new ProductCategoriesService(app.prisma));

  const tags = ["product-categories"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/product-categories",
    {
      preHandler: [app.authenticate, app.requirePermission("product_category.view")],
      schema: {
        tags,
        summary: "List product categories (paginated, searchable, filterable)",
        security,
        querystring: listProductCategoriesQuery,
        response: { 200: paginatedResponse(productCategorySchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/product-categories/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("product_category.view")],
      schema: {
        tags,
        summary: "Get a product category by id",
        security,
        params: categoryIdParams,
        response: { 200: dataResponse(productCategorySchema), ...commonErrors },
      },
    },
    controller.getById,
  );

  r.post(
    "/product-categories",
    {
      preHandler: [app.authenticate, app.requirePermission("product_category.create")],
      schema: {
        tags,
        summary: "Create a product category",
        security,
        body: createProductCategoryBody,
        response: { 201: dataResponse(productCategorySchema), ...commonErrors },
      },
    },
    controller.create,
  );

  r.put(
    "/product-categories/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("product_category.update")],
      schema: {
        tags,
        summary: "Update a product category",
        security,
        params: categoryIdParams,
        body: updateProductCategoryBody,
        response: { 200: dataResponse(productCategorySchema), ...commonErrors },
      },
    },
    controller.update,
  );

  r.delete(
    "/product-categories/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("product_category.delete")],
      schema: {
        tags,
        summary: "Soft-delete a product category (blocked if it has active products)",
        security,
        params: categoryIdParams,
        response: { 204: z.null(), ...commonErrors },
      },
    },
    controller.remove,
  );
}
