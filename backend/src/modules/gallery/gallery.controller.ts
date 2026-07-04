import type { FastifyReply, FastifyRequest } from "fastify";
import type { MultipartFields } from "@fastify/multipart";
import { BadRequest } from "../../lib/errors.js";
import type { ActorContext } from "../users/users.service.js";
import type { GalleryService } from "./gallery.service.js";
import { createGalleryBody } from "./gallery.schema.js";
import type { ListGalleryQuery, UpdateGalleryInput } from "./gallery.types.js";

type IdParams = { id: string };

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

/** Reads a plain text value from the multipart field map (ignores files). */
function fieldValue(fields: MultipartFields, key: string): string | undefined {
  const part = fields[key];
  if (!part || Array.isArray(part) || part.type !== "field") return undefined;
  return typeof part.value === "string" ? part.value : undefined;
}

export function createGalleryController(service: GalleryService) {
  return {
    // Public — published images for the marketing site.
    publicList: async (request: FastifyRequest<{ Querystring: { category?: string } }>) => {
      const { data, categories } = await service.publicList(request.query.category);
      return { data, meta: { categories } };
    },

    list: async (request: FastifyRequest<{ Querystring: ListGalleryQuery }>) => {
      return service.list(request.query);
    },

    getById: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.getById(request.params.id) };
    },

    // Multipart upload: text fields (appended before the file) + the image file.
    create: async (request: FastifyRequest, reply: FastifyReply) => {
      const file = await request.file();
      if (!file) throw BadRequest("No image file was provided");

      const parsed = createGalleryBody.safeParse({
        title: fieldValue(file.fields, "title"),
        category: fieldValue(file.fields, "category"),
        sortOrder: fieldValue(file.fields, "sortOrder"),
        isPublished: fieldValue(file.fields, "isPublished"),
      });
      if (!parsed.success) {
        throw BadRequest(parsed.error.issues[0]?.message ?? "Invalid gallery details");
      }

      const imageUrl = await request.server.saveImage(file, "gallery");
      const data = await service.create(parsed.data, imageUrl, actorOf(request));
      return reply.code(201).send({ data });
    },

    update: async (request: FastifyRequest<{ Params: IdParams; Body: UpdateGalleryInput }>) => {
      return { data: await service.update(request.params.id, request.body, actorOf(request)) };
    },

    remove: async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      await service.remove(request.params.id, actorOf(request));
      return reply.code(204).send();
    },
  };
}
