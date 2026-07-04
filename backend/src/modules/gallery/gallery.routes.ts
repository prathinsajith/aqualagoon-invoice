import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { GalleryService } from "./gallery.service.js";
import { createGalleryController } from "./gallery.controller.js";
import {
  gallerySchema,
  galleryIdParams,
  listGalleryQuery,
  publicGalleryQuery,
  updateGalleryBody,
} from "./gallery.schema.js";

export async function galleryRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createGalleryController(new GalleryService(app.prisma, app.storage));

  const tags = ["gallery"];
  const security = [{ bearerAuth: [] }];

  // --- Public (no auth): published images for the marketing website ---------
  r.get(
    "/gallery",
    {
      schema: {
        tags,
        summary: "Public: list published gallery images (+ available categories)",
        querystring: publicGalleryQuery,
        response: {
          200: z.object({
            data: z.array(gallerySchema),
            meta: z.object({ categories: z.array(z.string()) }),
          }),
          ...commonErrors,
        },
      },
    },
    controller.publicList,
  );

  // --- Admin (auth + permission) --------------------------------------------
  r.get(
    "/gallery/admin",
    {
      preHandler: [app.authenticate, app.requirePermission("gallery.view")],
      schema: {
        tags,
        summary: "List gallery images (paginated; incl. unpublished)",
        security,
        querystring: listGalleryQuery,
        response: { 200: paginatedResponse(gallerySchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/gallery/admin/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("gallery.view")],
      schema: {
        tags,
        summary: "Get a gallery image by id",
        security,
        params: galleryIdParams,
        response: { 200: dataResponse(gallerySchema), ...commonErrors },
      },
    },
    controller.getById,
  );

  r.post(
    "/gallery",
    {
      preHandler: [app.authenticate, app.requirePermission("gallery.create")],
      schema: {
        tags,
        summary: "Upload a gallery image (multipart/form-data: title, category, file)",
        security,
        consumes: ["multipart/form-data"],
        response: { 201: dataResponse(gallerySchema), ...commonErrors },
      },
    },
    controller.create,
  );

  r.put(
    "/gallery/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("gallery.update")],
      schema: {
        tags,
        summary: "Update a gallery image's metadata (title, category, order, visibility)",
        security,
        params: galleryIdParams,
        body: updateGalleryBody,
        response: { 200: dataResponse(gallerySchema), ...commonErrors },
      },
    },
    controller.update,
  );

  r.delete(
    "/gallery/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("gallery.delete")],
      schema: {
        tags,
        summary: "Delete a gallery image",
        security,
        params: galleryIdParams,
        response: { 204: z.null(), ...commonErrors },
      },
    },
    controller.remove,
  );
}
