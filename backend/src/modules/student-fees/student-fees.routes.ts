import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { StudentFeesService } from "./student-fees.service.js";
import { createStudentFeesController } from "./student-fees.controller.js";
import {
  createStudentFeeBody,
  feeHistoryQuery,
  feeHistoryResponse,
  feeLedgerQuery,
  feeLedgerRowSchema,
  listStudentFeesQuery,
  studentFeeIdParams,
  studentFeeSchema,
} from "./student-fees.schema.js";

export async function studentFeesRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createStudentFeesController(new StudentFeesService(app.prisma));

  const tags = ["student-fees"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/student-fees",
    {
      preHandler: [app.authenticate, app.requirePermission("student_fee.view")],
      schema: {
        tags,
        summary: "List student fees (paginated, searchable, filterable)",
        security,
        querystring: listStudentFeesQuery,
        response: { 200: paginatedResponse(studentFeeSchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/student-fees/ledger",
    {
      preHandler: [app.authenticate, app.requirePermission("student_fee.view")],
      schema: {
        tags,
        summary: "Per-student fee ledger (billed / paid / balance per enrollment)",
        security,
        querystring: feeLedgerQuery,
        response: { 200: paginatedResponse(feeLedgerRowSchema), ...commonErrors },
      },
    },
    controller.ledger,
  );

  r.get(
    "/student-fees/history",
    {
      preHandler: [app.authenticate, app.requirePermission("student_fee.view")],
      schema: {
        tags,
        summary: "Payment history for one enrollment (newest first)",
        security,
        querystring: feeHistoryQuery,
        response: { 200: feeHistoryResponse, ...commonErrors },
      },
    },
    controller.history,
  );

  r.get(
    "/student-fees/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("student_fee.view")],
      schema: {
        tags,
        summary: "Get a student fee by id",
        security,
        params: studentFeeIdParams,
        response: { 200: dataResponse(studentFeeSchema), ...commonErrors },
      },
    },
    controller.getById,
  );

  r.post(
    "/student-fees",
    {
      preHandler: [app.authenticate, app.requirePermission("student_fee.create")],
      schema: {
        tags,
        summary: "Generate a student fee charge",
        security,
        body: createStudentFeeBody,
        response: { 201: dataResponse(studentFeeSchema), ...commonErrors },
      },
    },
    controller.create,
  );
}
