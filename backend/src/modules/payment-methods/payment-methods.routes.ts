import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { PaymentMethodsService } from "./payment-methods.service.js";
import { createPaymentMethodsController } from "./payment-methods.controller.js";
import {
  createPaymentMethodBody,
  listPaymentMethodsQuery,
  paymentMethodIdParams,
  paymentMethodSchema,
  updatePaymentMethodBody,
} from "./payment-methods.schema.js";

const reorderBody = z.object({ orderedIds: z.array(z.uuid()).min(1) });

export async function paymentMethodsRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createPaymentMethodsController(new PaymentMethodsService(app.prisma));

  const tags = ["payment-methods"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/payment-methods",
    {
      preHandler: [app.authenticate, app.requirePermission("payment_method.view")],
      schema: {
        tags,
        summary: "List payment methods (admin)",
        security,
        querystring: listPaymentMethodsQuery,
        response: { 200: paginatedResponse(paymentMethodSchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/payment-methods/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("payment_method.view")],
      schema: {
        tags,
        summary: "Get a payment method by id",
        security,
        params: paymentMethodIdParams,
        response: { 200: dataResponse(paymentMethodSchema), ...commonErrors },
      },
    },
    controller.getById,
  );

  r.post(
    "/payment-methods",
    {
      preHandler: [app.authenticate, app.requirePermission("payment_method.create")],
      schema: {
        tags,
        summary: "Create a payment method",
        security,
        body: createPaymentMethodBody,
        response: { 201: dataResponse(paymentMethodSchema), ...commonErrors },
      },
    },
    controller.create,
  );

  r.put(
    "/payment-methods/reorder",
    {
      preHandler: [app.authenticate, app.requirePermission("payment_method.update")],
      schema: {
        tags,
        summary: "Reorder payment methods (drag order)",
        security,
        body: reorderBody,
        response: { 200: dataResponse(z.array(paymentMethodSchema)), ...commonErrors },
      },
    },
    controller.reorder,
  );

  r.put(
    "/payment-methods/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("payment_method.update")],
      schema: {
        tags,
        summary: "Update / activate / deactivate a payment method",
        security,
        params: paymentMethodIdParams,
        body: updatePaymentMethodBody,
        response: { 200: dataResponse(paymentMethodSchema), ...commonErrors },
      },
    },
    controller.update,
  );

  r.delete(
    "/payment-methods/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("payment_method.delete")],
      schema: {
        tags,
        summary: "Soft-delete a payment method (blocked if used in payments)",
        security,
        params: paymentMethodIdParams,
        response: { 204: z.null(), ...commonErrors },
      },
    },
    controller.remove,
  );
}
