import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { commonErrors } from "../../lib/response.js";
import { ProfileService } from "./profile.service.js";
import { createProfileController } from "./profile.controller.js";
import { profileResponse, updateProfileBody } from "./profile.schema.js";

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createProfileController(new ProfileService(app.prisma, app.storage));

  const tags = ["profile"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/profile",
    {
      preHandler: [app.authenticate],
      schema: {
        tags,
        summary: "Get the current user's profile",
        security,
        response: { 200: profileResponse, ...commonErrors },
      },
    },
    controller.get,
  );

  r.put(
    "/profile",
    {
      preHandler: [app.authenticate],
      schema: {
        tags,
        summary: "Update the current user's profile",
        security,
        body: updateProfileBody,
        response: { 200: profileResponse, ...commonErrors },
      },
    },
    controller.update,
  );

  r.post(
    "/profile/photo",
    {
      preHandler: [app.authenticate],
      schema: {
        tags,
        summary: "Upload the current user's profile photo (multipart/form-data)",
        security,
        consumes: ["multipart/form-data"],
        response: { 200: profileResponse, ...commonErrors },
      },
    },
    controller.uploadPhoto,
  );
}
