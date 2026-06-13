import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { commonErrors } from "../../lib/response.js";
import { PermissionsService } from "./permissions.service.js";
import { createPermissionsController } from "./permissions.controller.js";
import {
  assignPermissionsBody,
  listPermissionsQuery,
  permissionSchema,
  rolePermissionParams,
} from "./permissions.schema.js";
import { roleIdParams } from "../roles/roles.schema.js";

const listResponse = z.object({ data: z.array(permissionSchema) });

export async function permissionsRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createPermissionsController(new PermissionsService(app.prisma));

  const tags = ["permissions"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/permissions",
    {
      preHandler: [app.authenticate, app.requirePermission("permission.view")],
      schema: {
        tags,
        summary: "List the permission catalog",
        security,
        querystring: listPermissionsQuery,
        response: { 200: listResponse, ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/roles/:id/permissions",
    {
      preHandler: [app.authenticate, app.requirePermission("permission.view")],
      schema: {
        tags,
        summary: "List the permissions assigned to a role",
        security,
        params: roleIdParams,
        response: { 200: listResponse, ...commonErrors },
      },
    },
    controller.listForRole,
  );

  r.post(
    "/roles/:id/permissions",
    {
      preHandler: [app.authenticate, app.requirePermission("permission.assign")],
      schema: {
        tags,
        summary: "Assign permissions to a role",
        security,
        params: roleIdParams,
        body: assignPermissionsBody,
        response: { 200: listResponse, ...commonErrors },
      },
    },
    controller.assign,
  );

  r.delete(
    "/roles/:id/permissions/:permissionId",
    {
      preHandler: [app.authenticate, app.requirePermission("permission.assign")],
      schema: {
        tags,
        summary: "Remove a permission from a role",
        security,
        params: rolePermissionParams,
        response: { 204: z.null(), ...commonErrors },
      },
    },
    controller.revoke,
  );
}
