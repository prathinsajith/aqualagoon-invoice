import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { RolesService } from "./roles.service.js";
import { createRolesController } from "./roles.controller.js";
import {
  createRoleBody,
  listRolesQuery,
  reorderRolesBody,
  roleIdParams,
  roleSchema,
  setAssignableRolesBody,
  updateRoleBody,
} from "./roles.schema.js";

export async function rolesRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createRolesController(new RolesService(app.prisma));

  const tags = ["roles"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/roles",
    {
      preHandler: [app.authenticate, app.requirePermission("role.view")],
      schema: {
        tags,
        summary: "List roles (paginated)",
        security,
        querystring: listRolesQuery,
        response: { 200: paginatedResponse(roleSchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/roles/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("role.view")],
      schema: {
        tags,
        summary: "Get a role by id",
        security,
        params: roleIdParams,
        response: { 200: dataResponse(roleSchema), ...commonErrors },
      },
    },
    controller.getById,
  );

  r.post(
    "/roles",
    {
      preHandler: [app.authenticate, app.requirePermission("role.create")],
      schema: {
        tags,
        summary: "Create a role",
        security,
        body: createRoleBody,
        response: { 201: dataResponse(roleSchema), ...commonErrors },
      },
    },
    controller.create,
  );

  r.put(
    "/roles/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("role.update")],
      schema: {
        tags,
        summary: "Update a role",
        security,
        params: roleIdParams,
        body: updateRoleBody,
        response: { 200: dataResponse(roleSchema), ...commonErrors },
      },
    },
    controller.update,
  );

  r.put(
    "/roles/reorder",
    {
      preHandler: [app.authenticate, app.requirePermission("role.update")],
      schema: {
        tags,
        summary: "Reorder roles (drag order)",
        security,
        body: reorderRolesBody,
        response: { 200: dataResponse(z.array(roleSchema)), ...commonErrors },
      },
    },
    controller.reorder,
  );

  r.put(
    "/roles/:id/assignable-roles",
    {
      preHandler: [app.authenticate, app.requirePermission("setting.manage")],
      schema: {
        tags,
        summary: "Set which roles this role may assign/view (company settings)",
        security,
        params: roleIdParams,
        body: setAssignableRolesBody,
        response: { 200: dataResponse(roleSchema), ...commonErrors },
      },
    },
    controller.setAssignableRoles,
  );

  r.delete(
    "/roles/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("role.delete")],
      schema: {
        tags,
        summary: "Delete a role (system roles are protected)",
        security,
        params: roleIdParams,
        response: { 204: z.null(), ...commonErrors },
      },
    },
    controller.remove,
  );
}
