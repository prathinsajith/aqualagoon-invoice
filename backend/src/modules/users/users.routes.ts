import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { UsersService } from "./users.service.js";
import { createUsersController } from "./users.controller.js";
import {
  createUserBody,
  listUsersQuery,
  updateUserBody,
  userIdParams,
  userSchema,
} from "./users.schema.js";
import { roleSchema } from "../roles/roles.schema.js";

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createUsersController(new UsersService(app.prisma, app.storage));

  const tags = ["users"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/users",
    {
      preHandler: [app.authenticate, app.requirePermission("user.view")],
      schema: {
        tags,
        summary: "List users (paginated, searchable, filterable)",
        security,
        querystring: listUsersQuery,
        response: { 200: paginatedResponse(userSchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/users/assignable-roles",
    {
      preHandler: [app.authenticate, app.requirePermission("user.create")],
      schema: {
        tags,
        summary: "Roles the current user is allowed to assign when managing users",
        security,
        response: { 200: dataResponse(z.array(roleSchema)), ...commonErrors },
      },
    },
    controller.assignableRoles,
  );

  r.get(
    "/users/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("user.view")],
      schema: {
        tags,
        summary: "Get a user by id",
        security,
        params: userIdParams,
        response: { 200: dataResponse(userSchema), ...commonErrors },
      },
    },
    controller.getById,
  );

  r.post(
    "/users",
    {
      preHandler: [app.authenticate, app.requirePermission("user.create")],
      schema: {
        tags,
        summary: "Create a user",
        security,
        body: createUserBody,
        response: { 201: dataResponse(userSchema), ...commonErrors },
      },
    },
    controller.create,
  );

  r.put(
    "/users/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("user.update")],
      schema: {
        tags,
        summary: "Update a user",
        security,
        params: userIdParams,
        body: updateUserBody,
        response: { 200: dataResponse(userSchema), ...commonErrors },
      },
    },
    controller.update,
  );

  r.delete(
    "/users/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("user.delete")],
      schema: {
        tags,
        summary: "Soft-delete (archive) a user",
        security,
        params: userIdParams,
        response: { 204: z.null(), ...commonErrors },
      },
    },
    controller.remove,
  );

  r.post(
    "/users/:id/photo",
    {
      preHandler: [app.authenticate, app.requirePermission("user.update")],
      schema: {
        tags,
        summary: "Upload a user's profile photo (multipart/form-data)",
        security,
        params: userIdParams,
        consumes: ["multipart/form-data"],
        response: { 200: dataResponse(userSchema), ...commonErrors },
      },
    },
    controller.uploadPhoto,
  );

  r.post(
    "/users/:id/restore",
    {
      preHandler: [app.authenticate, app.requirePermission("user.restore")],
      schema: {
        tags,
        summary: "Restore an archived user",
        security,
        params: userIdParams,
        response: { 200: dataResponse(userSchema), ...commonErrors },
      },
    },
    controller.restore,
  );
}
