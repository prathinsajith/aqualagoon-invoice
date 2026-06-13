import type { FastifyReply, FastifyRequest } from "fastify";
import type { ActorContext } from "../users/users.service.js";
import type { PassTypesService } from "./pass-types.service.js";
import type {
  CreatePassTypeInput,
  ListPassTypesQuery,
  UpdatePassTypeInput,
} from "./pass-types.types.js";

type IdParams = { id: string };

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createPassTypesController(service: PassTypesService) {
  return {
    list: async (request: FastifyRequest<{ Querystring: ListPassTypesQuery }>) => {
      return service.list(request.query);
    },

    getById: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.getById(request.params.id) };
    },

    create: async (request: FastifyRequest<{ Body: CreatePassTypeInput }>, reply: FastifyReply) => {
      const data = await service.create(request.body, actorOf(request));
      return reply.code(201).send({ data });
    },

    update: async (request: FastifyRequest<{ Params: IdParams; Body: UpdatePassTypeInput }>) => {
      return { data: await service.update(request.params.id, request.body, actorOf(request)) };
    },

    remove: async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      await service.remove(request.params.id, actorOf(request));
      return reply.code(204).send();
    },
  };
}
