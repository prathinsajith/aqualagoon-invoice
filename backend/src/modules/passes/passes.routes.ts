import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { PassesService } from "./passes.service.js";
import { createPassesController } from "./passes.controller.js";
import {
  listPassesQuery,
  passIdParams,
  renewBody,
  suspendCancelBody,
  usageBody,
  userPassDetailSchema,
  userPassSchema,
} from "./passes.schema.js";

export async function passesRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createPassesController(new PassesService(app.prisma));

  const tags = ["passes"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/passes",
    {
      preHandler: [app.authenticate, app.requirePermission("pass.view")],
      schema: {
        tags,
        summary: "List user passes (paginated, filterable, searchable by number)",
        security,
        querystring: listPassesQuery,
        response: { 200: paginatedResponse(userPassSchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/passes/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("pass.view")],
      schema: {
        tags,
        summary: "Get a pass with its usage history",
        security,
        params: passIdParams,
        response: { 200: dataResponse(userPassDetailSchema), ...commonErrors },
      },
    },
    controller.getById,
  );

  r.post(
    "/passes/:id/activate",
    {
      preHandler: [app.authenticate, app.requirePermission("pass.activate")],
      schema: {
        tags,
        summary: "Activate a pending pass",
        security,
        params: passIdParams,
        response: { 200: dataResponse(userPassSchema), ...commonErrors },
      },
    },
    controller.activate,
  );

  r.post(
    "/passes/:id/suspend",
    {
      preHandler: [app.authenticate, app.requirePermission("pass.suspend")],
      schema: {
        tags,
        summary: "Suspend an active pass",
        security,
        params: passIdParams,
        body: suspendCancelBody,
        response: { 200: dataResponse(userPassSchema), ...commonErrors },
      },
    },
    controller.suspend,
  );

  r.post(
    "/passes/:id/cancel",
    {
      preHandler: [app.authenticate, app.requirePermission("pass.cancel")],
      schema: {
        tags,
        summary: "Cancel a pass",
        security,
        params: passIdParams,
        body: suspendCancelBody,
        response: { 200: dataResponse(userPassSchema), ...commonErrors },
      },
    },
    controller.cancel,
  );

  r.post(
    "/passes/:id/renew",
    {
      preHandler: [app.authenticate, app.requirePermission("pass.renew")],
      schema: {
        tags,
        summary: "Renew / extend a pass's validity",
        security,
        params: passIdParams,
        body: renewBody,
        response: { 200: dataResponse(userPassSchema), ...commonErrors },
      },
    },
    controller.renew,
  );

  r.post(
    "/passes/:id/entry",
    {
      preHandler: [app.authenticate, app.requirePermission("pass.view")],
      schema: {
        tags,
        summary: "Record a pass entry (validates + decrements remaining entries)",
        security,
        params: passIdParams,
        body: usageBody,
        response: { 200: dataResponse(userPassDetailSchema), ...commonErrors },
      },
    },
    controller.entry,
  );

  r.post(
    "/passes/:id/exit",
    {
      preHandler: [app.authenticate, app.requirePermission("pass.view")],
      schema: {
        tags,
        summary: "Record a pass exit (closes the latest open entry)",
        security,
        params: passIdParams,
        body: usageBody,
        response: { 200: dataResponse(userPassDetailSchema), ...commonErrors },
      },
    },
    controller.exit,
  );
}
