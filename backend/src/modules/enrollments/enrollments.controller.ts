import type { FastifyReply, FastifyRequest } from "fastify";
import type { ActorContext } from "../users/users.service.js";
import type { EnrollmentsService } from "./enrollments.service.js";
import type {
  CreateEnrollmentInput,
  ListEnrollmentsQuery,
  UpdateEnrollmentInput,
} from "./enrollments.types.js";

type IdParams = { id: string };

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createEnrollmentsController(service: EnrollmentsService) {
  return {
    list: async (request: FastifyRequest<{ Querystring: ListEnrollmentsQuery }>) => {
      return service.list(request.query);
    },

    getById: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.getById(request.params.id) };
    },

    create: async (request: FastifyRequest<{ Body: CreateEnrollmentInput }>, reply: FastifyReply) => {
      const data = await service.create(request.body, actorOf(request));
      return reply.code(201).send({ data });
    },

    update: async (
      request: FastifyRequest<{ Params: IdParams; Body: UpdateEnrollmentInput }>,
    ) => {
      return { data: await service.update(request.params.id, request.body, actorOf(request)) };
    },
  };
}
