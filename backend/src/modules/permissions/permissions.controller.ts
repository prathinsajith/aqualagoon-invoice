import type { FastifyReply, FastifyRequest } from "fastify";
import type { ActorContext } from "../users/users.service.js";
import type { PermissionsService } from "./permissions.service.js";
import type { AssignPermissionsInput } from "./permissions.types.js";

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createPermissionsController(service: PermissionsService) {
  return {
    list: async (request: FastifyRequest<{ Querystring: { module?: string } }>) => {
      return { data: await service.list(request.query.module) };
    },

    listForRole: async (request: FastifyRequest<{ Params: { id: string } }>) => {
      return { data: await service.listForRole(request.params.id) };
    },

    assign: async (
      request: FastifyRequest<{ Params: { id: string }; Body: AssignPermissionsInput }>,
    ) => {
      const data = await service.assign(
        request.params.id,
        request.body.permissionIds,
        actorOf(request),
      );
      return { data };
    },

    revoke: async (
      request: FastifyRequest<{ Params: { id: string; permissionId: string } }>,
      reply: FastifyReply,
    ) => {
      await service.revoke(request.params.id, request.params.permissionId, actorOf(request));
      return reply.code(204).send();
    },
  };
}
