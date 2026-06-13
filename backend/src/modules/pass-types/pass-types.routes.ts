import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { PassTypesService } from "./pass-types.service.js";
import { createPassTypesController } from "./pass-types.controller.js";
import {
  createPassTypeBody,
  listPassTypesQuery,
  passTypeIdParams,
  passTypeSchema,
  updatePassTypeBody,
} from "./pass-types.schema.js";

export async function passTypesRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createPassTypesController(new PassTypesService(app.prisma));

  const tags = ["pass-types"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/pass-types",
    {
      preHandler: [app.authenticate, app.requirePermission("pass_type.view")],
      schema: {
        tags,
        summary: "List pass types (paginated, searchable, filterable)",
        security,
        querystring: listPassTypesQuery,
        response: { 200: paginatedResponse(passTypeSchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/pass-types/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("pass_type.view")],
      schema: {
        tags,
        summary: "Get a pass type by id",
        security,
        params: passTypeIdParams,
        response: { 200: dataResponse(passTypeSchema), ...commonErrors },
      },
    },
    controller.getById,
  );

  r.post(
    "/pass-types",
    {
      preHandler: [app.authenticate, app.requirePermission("pass_type.create")],
      schema: {
        tags,
        summary: "Create a pass type",
        security,
        body: createPassTypeBody,
        response: { 201: dataResponse(passTypeSchema), ...commonErrors },
      },
    },
    controller.create,
  );

  r.put(
    "/pass-types/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("pass_type.update")],
      schema: {
        tags,
        summary: "Update / activate / deactivate a pass type",
        security,
        params: passTypeIdParams,
        body: updatePassTypeBody,
        response: { 200: dataResponse(passTypeSchema), ...commonErrors },
      },
    },
    controller.update,
  );

  r.delete(
    "/pass-types/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("pass_type.delete")],
      schema: {
        tags,
        summary: "Soft-delete a pass type (blocked if passes were issued)",
        security,
        params: passTypeIdParams,
        response: { 204: z.null(), ...commonErrors },
      },
    },
    controller.remove,
  );
}
