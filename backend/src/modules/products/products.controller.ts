import type { FastifyReply, FastifyRequest } from "fastify";
import { BadRequest } from "../../lib/errors.js";
import type { ActorContext } from "../users/users.service.js";
import type { ProductsService } from "./products.service.js";
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from "./products.types.js";

type IdParams = { id: string };

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createProductsController(service: ProductsService) {
  return {
    list: async (request: FastifyRequest<{ Querystring: ListProductsQuery }>) => {
      return service.list(request.query);
    },

    getById: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.getById(request.params.id) };
    },

    create: async (request: FastifyRequest<{ Body: CreateProductInput }>, reply: FastifyReply) => {
      const data = await service.create(request.body, actorOf(request));
      return reply.code(201).send({ data });
    },

    update: async (request: FastifyRequest<{ Params: IdParams; Body: UpdateProductInput }>) => {
      return { data: await service.update(request.params.id, request.body, actorOf(request)) };
    },

    remove: async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      await service.remove(request.params.id, actorOf(request));
      return reply.code(204).send();
    },

    restore: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.restore(request.params.id, actorOf(request)) };
    },

    uploadImage: async (request: FastifyRequest<{ Params: IdParams }>) => {
      const file = await request.file();
      if (!file) throw BadRequest("No image file was provided");
      const imageUrl = await request.server.saveImage(file, "products");
      return { data: await service.setImage(request.params.id, imageUrl, actorOf(request)) };
    },

    deleteImage: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.removeImage(request.params.id, actorOf(request)) };
    },
  };
}
