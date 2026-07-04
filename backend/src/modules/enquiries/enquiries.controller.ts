import type { FastifyReply, FastifyRequest } from "fastify";
import type { z } from "zod";
import type { ActorContext } from "../users/users.service.js";
import type { EnquiriesService } from "./enquiries.service.js";
import type {
  createEnquiryBody,
  listEnquiriesQuery,
  updateEnquiryBody,
} from "./enquiries.schema.js";

type CreateBody = z.infer<typeof createEnquiryBody>;
type ListQuery = z.infer<typeof listEnquiriesQuery>;
type UpdateBody = z.infer<typeof updateEnquiryBody>;
type IdParams = { id: string };

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createEnquiriesController(service: EnquiriesService) {
  return {
    // Public — website form submission.
    create: async (request: FastifyRequest<{ Body: CreateBody }>, reply: FastifyReply) => {
      const data = await service.create(request.body);
      return reply.code(201).send({ data });
    },

    list: async (request: FastifyRequest<{ Querystring: ListQuery }>) => {
      return service.list(request.query);
    },

    updateStatus: async (request: FastifyRequest<{ Params: IdParams; Body: UpdateBody }>) => {
      return { data: await service.updateStatus(request.params.id, request.body.status, actorOf(request)) };
    },
  };
}
