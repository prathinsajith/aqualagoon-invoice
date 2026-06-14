import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { TrainingProgramsService } from "./training-programs.service.js";
import { createTrainingProgramsController } from "./training-programs.controller.js";
import {
  createTrainingProgramBody,
  listTrainingProgramsQuery,
  trainingProgramIdParams,
  trainingProgramSchema,
  updateTrainingProgramBody,
} from "./training-programs.schema.js";

export async function trainingProgramsRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createTrainingProgramsController(new TrainingProgramsService(app.prisma));

  const tags = ["training-programs"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/training-programs",
    {
      preHandler: [app.authenticate, app.requirePermission("training_program.view")],
      schema: {
        tags,
        summary: "List training programs (paginated, searchable, filterable)",
        security,
        querystring: listTrainingProgramsQuery,
        response: { 200: paginatedResponse(trainingProgramSchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/training-programs/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("training_program.view")],
      schema: {
        tags,
        summary: "Get a training program by id",
        security,
        params: trainingProgramIdParams,
        response: { 200: dataResponse(trainingProgramSchema), ...commonErrors },
      },
    },
    controller.getById,
  );

  r.post(
    "/training-programs",
    {
      preHandler: [app.authenticate, app.requirePermission("training_program.create")],
      schema: {
        tags,
        summary: "Create a training program",
        security,
        body: createTrainingProgramBody,
        response: { 201: dataResponse(trainingProgramSchema), ...commonErrors },
      },
    },
    controller.create,
  );

  r.put(
    "/training-programs/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("training_program.update")],
      schema: {
        tags,
        summary: "Update a training program",
        security,
        params: trainingProgramIdParams,
        body: updateTrainingProgramBody,
        response: { 200: dataResponse(trainingProgramSchema), ...commonErrors },
      },
    },
    controller.update,
  );

  r.delete(
    "/training-programs/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("training_program.delete")],
      schema: {
        tags,
        summary: "Soft-delete a training program (blocked if it has fee plans or batches)",
        security,
        params: trainingProgramIdParams,
        response: { 204: z.null(), ...commonErrors },
      },
    },
    controller.remove,
  );
}
