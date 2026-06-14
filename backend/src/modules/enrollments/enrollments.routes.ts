import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { EnrollmentsService } from "./enrollments.service.js";
import { createEnrollmentsController } from "./enrollments.controller.js";
import {
  createEnrollmentBody,
  enrollmentIdParams,
  enrollmentSchema,
  listEnrollmentsQuery,
  updateEnrollmentBody,
} from "./enrollments.schema.js";

export async function enrollmentsRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createEnrollmentsController(new EnrollmentsService(app.prisma));

  const tags = ["enrollments"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/enrollments",
    {
      preHandler: [app.authenticate, app.requirePermission("enrollment.view")],
      schema: {
        tags,
        summary: "List enrollments (paginated, filterable, searchable by student name)",
        security,
        querystring: listEnrollmentsQuery,
        response: { 200: paginatedResponse(enrollmentSchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/enrollments/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("enrollment.view")],
      schema: {
        tags,
        summary: "Get an enrollment",
        security,
        params: enrollmentIdParams,
        response: { 200: dataResponse(enrollmentSchema), ...commonErrors },
      },
    },
    controller.getById,
  );

  r.post(
    "/enrollments",
    {
      preHandler: [app.authenticate, app.requirePermission("enrollment.create")],
      schema: {
        tags,
        summary: "Enroll a student into a batch",
        security,
        body: createEnrollmentBody,
        response: { 201: dataResponse(enrollmentSchema), ...commonErrors },
      },
    },
    controller.create,
  );

  r.put(
    "/enrollments/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("enrollment.update")],
      schema: {
        tags,
        summary: "Update an enrollment's status or fee plan",
        security,
        params: enrollmentIdParams,
        body: updateEnrollmentBody,
        response: { 200: dataResponse(enrollmentSchema), ...commonErrors },
      },
    },
    controller.update,
  );
}
