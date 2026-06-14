import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { FeePlansService } from "./fee-plans.service.js";
import { createFeePlansController } from "./fee-plans.controller.js";
import {
  createFeePlanBody,
  listFeePlansQuery,
  feePlanIdParams,
  feePlanSchema,
  updateFeePlanBody,
} from "./fee-plans.schema.js";

export async function feePlansRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createFeePlansController(new FeePlansService(app.prisma));

  const tags = ["fee-plans"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/fee-plans",
    {
      preHandler: [app.authenticate, app.requirePermission("fee_plan.view")],
      schema: {
        tags,
        summary: "List fee plans (paginated, searchable, filterable)",
        security,
        querystring: listFeePlansQuery,
        response: { 200: paginatedResponse(feePlanSchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/fee-plans/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("fee_plan.view")],
      schema: {
        tags,
        summary: "Get a fee plan by id",
        security,
        params: feePlanIdParams,
        response: { 200: dataResponse(feePlanSchema), ...commonErrors },
      },
    },
    controller.getById,
  );

  r.post(
    "/fee-plans",
    {
      preHandler: [app.authenticate, app.requirePermission("fee_plan.create")],
      schema: {
        tags,
        summary: "Create a fee plan",
        security,
        body: createFeePlanBody,
        response: { 201: dataResponse(feePlanSchema), ...commonErrors },
      },
    },
    controller.create,
  );

  r.put(
    "/fee-plans/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("fee_plan.update")],
      schema: {
        tags,
        summary: "Update a fee plan",
        security,
        params: feePlanIdParams,
        body: updateFeePlanBody,
        response: { 200: dataResponse(feePlanSchema), ...commonErrors },
      },
    },
    controller.update,
  );

  r.delete(
    "/fee-plans/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("fee_plan.delete")],
      schema: {
        tags,
        summary: "Soft-delete a fee plan (blocked if it has student fees or enrollments)",
        security,
        params: feePlanIdParams,
        response: { 204: z.null(), ...commonErrors },
      },
    },
    controller.remove,
  );
}
