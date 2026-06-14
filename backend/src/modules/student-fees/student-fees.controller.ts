import type { FastifyReply, FastifyRequest } from "fastify";
import type { ActorContext } from "../users/users.service.js";
import type { StudentFeesService } from "./student-fees.service.js";
import type {
  CreateStudentFeeInput,
  FeeLedgerQuery,
  ListStudentFeesQuery,
} from "./student-fees.types.js";

type IdParams = { id: string };

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createStudentFeesController(service: StudentFeesService) {
  return {
    list: async (request: FastifyRequest<{ Querystring: ListStudentFeesQuery }>) => {
      return service.list(request.query);
    },

    ledger: async (request: FastifyRequest<{ Querystring: FeeLedgerQuery }>) => {
      return service.ledger(request.query);
    },

    getById: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.getById(request.params.id) };
    },

    create: async (
      request: FastifyRequest<{ Body: CreateStudentFeeInput }>,
      reply: FastifyReply,
    ) => {
      const data = await service.create(request.body, actorOf(request));
      return reply.code(201).send({ data });
    },
  };
}
