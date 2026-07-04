import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { commonErrors, dataResponse } from "../../lib/response.js";
import { SiteContentService } from "./site-content.service.js";
import { createSiteContentController } from "./site-content.controller.js";
import { sectionKeyParams, siteContentSchema } from "./site-content.schema.js";

export async function siteContentRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createSiteContentController(new SiteContentService(app.prisma));

  const tags = ["site-content"];
  const security = [{ bearerAuth: [] }];
  // Section bodies are validated per-key in the controller, so the route body
  // is permissive; the response is the normalized section (shape varies by key).
  const anyData = z.object({ data: z.unknown() });

  // --- Public: full content document for the website ------------------------
  r.get(
    "/site-content",
    {
      schema: {
        tags,
        summary: "Public: full marketing-site content (all sections, with defaults)",
        response: { 200: dataResponse(siteContentSchema), ...commonErrors },
      },
    },
    controller.getAll,
  );

  // --- Admin: also readable behind auth (same document) ---------------------
  r.get(
    "/site-content/admin",
    {
      preHandler: [app.authenticate, app.requirePermission("website.view")],
      schema: {
        tags,
        summary: "Marketing-site content (admin)",
        security,
        response: { 200: dataResponse(siteContentSchema), ...commonErrors },
      },
    },
    controller.getAll,
  );

  // --- Admin: update one section -------------------------------------------
  r.put(
    "/site-content/:key",
    {
      preHandler: [app.authenticate, app.requirePermission("website.manage")],
      schema: {
        tags,
        summary: "Update a content section (homepage | contact | services | branding)",
        security,
        params: sectionKeyParams,
        body: z.record(z.string(), z.unknown()),
        response: { 200: anyData, ...commonErrors },
      },
    },
    controller.update,
  );

  // --- Admin: upload an image (hero / logo / OG) ---------------------------
  r.post(
    "/site-content/image",
    {
      preHandler: [app.authenticate, app.requirePermission("website.manage")],
      schema: {
        tags,
        summary: "Upload a website image (multipart/form-data); returns its URL",
        security,
        consumes: ["multipart/form-data"],
        response: { 200: dataResponse(z.object({ url: z.string() })), ...commonErrors },
      },
    },
    controller.uploadImage,
  );
}
