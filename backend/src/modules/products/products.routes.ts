import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { ProductsService } from "./products.service.js";
import { createProductsController } from "./products.controller.js";
import {
  createProductBody,
  listProductsQuery,
  productIdParams,
  productSchema,
  updateProductBody,
} from "./products.schema.js";

export async function productsRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createProductsController(new ProductsService(app.prisma, app.storage));

  const tags = ["products"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/products",
    {
      preHandler: [app.authenticate, app.requirePermission("product.view")],
      schema: {
        tags,
        summary: "List products (paginated; search name/sku/barcode; filter + sort)",
        security,
        querystring: listProductsQuery,
        response: { 200: paginatedResponse(productSchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/products/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("product.view")],
      schema: {
        tags,
        summary: "Get a product by id",
        security,
        params: productIdParams,
        response: { 200: dataResponse(productSchema), ...commonErrors },
      },
    },
    controller.getById,
  );

  r.post(
    "/products",
    {
      preHandler: [app.authenticate, app.requirePermission("product.create")],
      schema: {
        tags,
        summary: "Create a product (SKU is auto-generated)",
        security,
        body: createProductBody,
        response: { 201: dataResponse(productSchema), ...commonErrors },
      },
    },
    controller.create,
  );

  r.put(
    "/products/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("product.update")],
      schema: {
        tags,
        summary: "Update a product",
        security,
        params: productIdParams,
        body: updateProductBody,
        response: { 200: dataResponse(productSchema), ...commonErrors },
      },
    },
    controller.update,
  );

  r.delete(
    "/products/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("product.delete")],
      schema: {
        tags,
        summary: "Soft-delete (archive) a product",
        security,
        params: productIdParams,
        response: { 204: z.null(), ...commonErrors },
      },
    },
    controller.remove,
  );

  r.post(
    "/products/:id/restore",
    {
      preHandler: [app.authenticate, app.requirePermission("product.update")],
      schema: {
        tags,
        summary: "Restore an archived product",
        security,
        params: productIdParams,
        response: { 200: dataResponse(productSchema), ...commonErrors },
      },
    },
    controller.restore,
  );

  r.post(
    "/products/:id/image",
    {
      preHandler: [app.authenticate, app.requirePermission("product.update")],
      schema: {
        tags,
        summary: "Upload or replace the product image (multipart/form-data, max 5 MB)",
        security,
        consumes: ["multipart/form-data"],
        params: productIdParams,
        response: { 200: dataResponse(productSchema), ...commonErrors },
      },
    },
    controller.uploadImage,
  );

  r.delete(
    "/products/:id/image",
    {
      preHandler: [app.authenticate, app.requirePermission("product.update")],
      schema: {
        tags,
        summary: "Remove the product image",
        security,
        params: productIdParams,
        response: { 200: dataResponse(productSchema), ...commonErrors },
      },
    },
    controller.deleteImage,
  );
}
