import type { FastifyReply, FastifyRequest } from "fastify";
import type { ActorContext } from "../users/users.service.js";
import type { BillingService } from "./billing.service.js";
import type { CheckoutInput, ListInvoicesQuery } from "./billing.types.js";

type IdParams = { id: string };

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createBillingController(service: BillingService) {
  return {
    checkout: async (request: FastifyRequest<{ Body: CheckoutInput }>, reply: FastifyReply) => {
      const data = await service.checkout(request.body, actorOf(request));
      return reply.code(201).send({ data });
    },

    payFee: async (
      request: FastifyRequest<{ Params: IdParams; Body: { amount: number; paymentMethodId: string } }>,
      reply: FastifyReply,
    ) => {
      const data = await service.payFee(
        request.params.id,
        request.body.amount,
        request.body.paymentMethodId,
        actorOf(request),
      );
      return reply.code(201).send({ data });
    },

    catalog: async (
      request: FastifyRequest<{ Querystring: { search?: string; limit: number; customerId?: string } }>,
    ) => {
      return {
        data: await service.catalog(
          request.query.search,
          request.query.limit,
          request.query.customerId,
        ),
      };
    },

    listInvoices: async (request: FastifyRequest<{ Querystring: ListInvoicesQuery }>) => {
      return service.list(request.query);
    },

    getInvoice: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.getById(request.params.id) };
    },

    cancelInvoice: async (
      request: FastifyRequest<{ Params: IdParams; Body: { reason?: string | null } }>,
    ) => {
      return { data: await service.cancel(request.params.id, request.body?.reason, actorOf(request)) };
    },

    receipt: async (request: FastifyRequest<{ Params: IdParams }>) => {
      return { data: await service.receipt(request.params.id) };
    },
  };
}
