import type { FastifyReply, FastifyRequest } from "fastify";
import type { ActorContext } from "../users/users.service.js";
import type { RolesService } from "./roles.service.js";
import type { CreateRoleInput, ListRolesQuery, UpdateRoleInput } from "./roles.types.js";

type IdParams = { id: string };

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createRolesController(service: RolesService) {
  return {
    list: async (request: FastifyRequest<{ Querystring: ListRolesQuery }>) => {
      return service.list(request.query);
    },

    getById: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.getById(request.params.id) };
    },

    create: async (request: FastifyRequest<{ Body: CreateRoleInput }>, reply: FastifyReply) => {
      const data = await service.create(request.body, actorOf(request));
      return reply.code(201).send({ data });
    },

    update: async (request: FastifyRequest<{ Params: IdParams; Body: UpdateRoleInput }>) => {
      return { data: await service.update(request.params.id, request.body, actorOf(request)) };
    },

    setAssignableRoles: async (
      request: FastifyRequest<{ Params: IdParams; Body: { assignableRoleIds: string[] } }>,
    ) => {
      return {
        data: await service.setAssignableRoles(
          request.params.id,
          request.body.assignableRoleIds,
          actorOf(request),
        ),
      };
    },

    reorder: async (request: FastifyRequest<{ Body: { orderedIds: string[] } }>) => {
      return { data: await service.reorder(request.body.orderedIds, actorOf(request)) };
    },

    remove: async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      await service.remove(request.params.id, actorOf(request));
      return reply.code(204).send();
    },
  };
}
