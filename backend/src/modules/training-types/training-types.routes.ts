import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { TrainingTypesService } from "./training-types.service.js";
import { createTrainingTypesController } from "./training-types.controller.js";
import {
  createTrainingTypeBody,
  listTrainingTypesQuery,
  trainingTypeIdParams,
  trainingTypeSchema,
  updateTrainingTypeBody,
} from "./training-types.schema.js";

export async function trainingTypesRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createTrainingTypesController(new TrainingTypesService(app.prisma));

  const tags = ["training-types"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/training-types",
    {
      preHandler: [app.authenticate, app.requirePermission("training_type.view")],
      schema: {
        tags,
        summary: "List training types (paginated, searchable, filterable)",
        security,
        querystring: listTrainingTypesQuery,
        response: { 200: paginatedResponse(trainingTypeSchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/training-types/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("training_type.view")],
      schema: {
        tags,
        summary: "Get a training type by id",
        security,
        params: trainingTypeIdParams,
        response: { 200: dataResponse(trainingTypeSchema), ...commonErrors },
      },
    },
    controller.getById,
  );

  r.post(
    "/training-types",
    {
      preHandler: [app.authenticate, app.requirePermission("training_type.create")],
      schema: {
        tags,
        summary: "Create a training type",
        security,
        body: createTrainingTypeBody,
        response: { 201: dataResponse(trainingTypeSchema), ...commonErrors },
      },
    },
    controller.create,
  );

  r.put(
    "/training-types/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("training_type.update")],
      schema: {
        tags,
        summary: "Update a training type",
        security,
        params: trainingTypeIdParams,
        body: updateTrainingTypeBody,
        response: { 200: dataResponse(trainingTypeSchema), ...commonErrors },
      },
    },
    controller.update,
  );

  r.delete(
    "/training-types/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("training_type.delete")],
      schema: {
        tags,
        summary: "Soft-delete a training type (blocked if it has programs)",
        security,
        params: trainingTypeIdParams,
        response: { 204: z.null(), ...commonErrors },
      },
    },
    controller.remove,
  );
}
