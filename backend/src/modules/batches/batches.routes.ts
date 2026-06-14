import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { BatchesService } from "./batches.service.js";
import { createBatchesController } from "./batches.controller.js";
import {
  batchIdParams,
  batchSchema,
  createBatchBody,
  listBatchesQuery,
  updateBatchBody,
} from "./batches.schema.js";

export async function batchesRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createBatchesController(new BatchesService(app.prisma));

  const tags = ["batches"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/batches",
    {
      preHandler: [app.authenticate, app.requirePermission("batch.view")],
      schema: {
        tags,
        summary: "List training batches (paginated, searchable, filterable)",
        security,
        querystring: listBatchesQuery,
        response: { 200: paginatedResponse(batchSchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/batches/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("batch.view")],
      schema: {
        tags,
        summary: "Get a batch by id",
        security,
        params: batchIdParams,
        response: { 200: dataResponse(batchSchema), ...commonErrors },
      },
    },
    controller.getById,
  );

  r.post(
    "/batches",
    {
      preHandler: [app.authenticate, app.requirePermission("batch.create")],
      schema: {
        tags,
        summary: "Create a training batch",
        security,
        body: createBatchBody,
        response: { 201: dataResponse(batchSchema), ...commonErrors },
      },
    },
    controller.create,
  );

  r.put(
    "/batches/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("batch.update")],
      schema: {
        tags,
        summary: "Update a batch / assign a trainer",
        security,
        params: batchIdParams,
        body: updateBatchBody,
        response: { 200: dataResponse(batchSchema), ...commonErrors },
      },
    },
    controller.update,
  );

  r.delete(
    "/batches/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("batch.delete")],
      schema: {
        tags,
        summary: "Delete a batch (blocked if it has enrollments)",
        security,
        params: batchIdParams,
        response: { 204: z.null(), ...commonErrors },
      },
    },
    controller.remove,
  );
}
