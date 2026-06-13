import type { FastifyReply, FastifyRequest } from "fastify";
import type { ActorContext } from "../users/users.service.js";
import type { ProductCategoriesService } from "./product-categories.service.js";
import type {
  CreateProductCategoryInput,
  ListProductCategoriesQuery,
  UpdateProductCategoryInput,
} from "./product-categories.types.js";

type IdParams = { id: string };

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createProductCategoriesController(service: ProductCategoriesService) {
  return {
    list: async (request: FastifyRequest<{ Querystring: ListProductCategoriesQuery }>) => {
      return service.list(request.query);
    },

    getById: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.getById(request.params.id) };
    },

    create: async (
      request: FastifyRequest<{ Body: CreateProductCategoryInput }>,
      reply: FastifyReply,
    ) => {
      const data = await service.create(request.body, actorOf(request));
      return reply.code(201).send({ data });
    },

    update: async (
      request: FastifyRequest<{ Params: IdParams; Body: UpdateProductCategoryInput }>,
    ) => {
      return { data: await service.update(request.params.id, request.body, actorOf(request)) };
    },

    remove: async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      await service.remove(request.params.id, actorOf(request));
      return reply.code(204).send();
    },
  };
}
