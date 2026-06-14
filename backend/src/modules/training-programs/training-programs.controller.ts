import type { FastifyReply, FastifyRequest } from "fastify";
import type { ActorContext } from "../users/users.service.js";
import type { TrainingProgramsService } from "./training-programs.service.js";
import type {
  CreateTrainingProgramInput,
  ListTrainingProgramsQuery,
  UpdateTrainingProgramInput,
} from "./training-programs.types.js";

type IdParams = { id: string };

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createTrainingProgramsController(service: TrainingProgramsService) {
  return {
    list: async (request: FastifyRequest<{ Querystring: ListTrainingProgramsQuery }>) => {
      return service.list(request.query);
    },

    getById: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.getById(request.params.id) };
    },

    create: async (
      request: FastifyRequest<{ Body: CreateTrainingProgramInput }>,
      reply: FastifyReply,
    ) => {
      const data = await service.create(request.body, actorOf(request));
      return reply.code(201).send({ data });
    },

    update: async (
      request: FastifyRequest<{ Params: IdParams; Body: UpdateTrainingProgramInput }>,
    ) => {
      return { data: await service.update(request.params.id, request.body, actorOf(request)) };
    },

    remove: async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      await service.remove(request.params.id, actorOf(request));
      return reply.code(204).send();
    },
  };
}
