import type { FastifyRequest } from "fastify";
import type { ActorContext } from "../users/users.service.js";
import type { PassesService } from "./passes.service.js";
import type { ListPassesQuery } from "./passes.types.js";

type IdParams = { id: string };
type ReasonBody = { reason?: string | null };
type RemarksBody = { remarks?: string | null };

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createPassesController(service: PassesService) {
  return {
    list: async (request: FastifyRequest<{ Querystring: ListPassesQuery }>) => {
      return service.list(request.query);
    },

    getById: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.getById(request.params.id) };
    },

    activate: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.activate(request.params.id, actorOf(request)) };
    },

    suspend: async (request: FastifyRequest<{ Params: IdParams; Body: ReasonBody }>) => {
      return { data: await service.suspend(request.params.id, request.body?.reason, actorOf(request)) };
    },

    cancel: async (request: FastifyRequest<{ Params: IdParams; Body: ReasonBody }>) => {
      return { data: await service.cancel(request.params.id, request.body?.reason, actorOf(request)) };
    },

    renew: async (
      request: FastifyRequest<{ Params: IdParams; Body: { durationValue?: number } }>,
    ) => {
      return {
        data: await service.renew(request.params.id, request.body?.durationValue, actorOf(request)),
      };
    },

    entry: async (request: FastifyRequest<{ Params: IdParams; Body: RemarksBody }>) => {
      return { data: await service.entry(request.params.id, request.body?.remarks) };
    },

    exit: async (request: FastifyRequest<{ Params: IdParams; Body: RemarksBody }>) => {
      return { data: await service.exit(request.params.id, request.body?.remarks) };
    },
  };
}
