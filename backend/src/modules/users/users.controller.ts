import type { FastifyReply, FastifyRequest } from "fastify";
import { BadRequest } from "../../lib/errors.js";
import type { UsersService, ActorContext } from "./users.service.js";
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from "./users.types.js";

type IdParams = { id: string };

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

/**
 * Thin HTTP adapter: pulls validated input off the request, delegates to the
 * service, and shapes the response envelope. No business logic here.
 */
export function createUsersController(service: UsersService) {
  return {
    list: async (request: FastifyRequest<{ Querystring: ListUsersQuery }>) => {
      return service.list(request.query, actorOf(request));
    },

    assignableRoles: async (request: FastifyRequest) => {
      return { data: await service.listAssignableRoles(actorOf(request)) };
    },

    getById: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.getById(request.params.id, actorOf(request)) };
    },

    create: async (
      request: FastifyRequest<{ Body: CreateUserInput }>,
      reply: FastifyReply,
    ) => {
      const data = await service.create(request.body, actorOf(request));
      return reply.code(201).send({ data });
    },

    update: async (
      request: FastifyRequest<{ Params: IdParams; Body: UpdateUserInput }>,
    ) => {
      return { data: await service.update(request.params.id, request.body, actorOf(request)) };
    },

    remove: async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      await service.remove(request.params.id, actorOf(request));
      return reply.code(204).send();
    },

    restore: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.restore(request.params.id, actorOf(request)) };
    },

    uploadPhoto: async (request: FastifyRequest<{ Params: IdParams }>) => {
      const file = await request.file();
      if (!file) throw BadRequest("No image file was provided");
      const photoUrl = await request.server.saveImage(file);
      return { data: await service.updatePhoto(request.params.id, photoUrl, actorOf(request)) };
    },
  };
}
