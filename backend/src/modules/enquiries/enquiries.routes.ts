import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { EnquiriesService } from "./enquiries.service.js";
import { createEnquiriesController } from "./enquiries.controller.js";
import {
  createEnquiryBody,
  enquiryIdParams,
  enquirySchema,
  listEnquiriesQuery,
  updateEnquiryBody,
} from "./enquiries.schema.js";

export async function enquiriesRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createEnquiriesController(new EnquiriesService(app.prisma));

  const tags = ["enquiries"];
  const security = [{ bearerAuth: [] }];

  // --- Public: capture a lead from the website (rate-limited against spam) ---
  r.post(
    "/enquiries",
    {
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
      schema: {
        tags,
        summary: "Public: submit a booking / contact enquiry",
        body: createEnquiryBody,
        response: { 201: dataResponse(enquirySchema), ...commonErrors },
      },
    },
    controller.create,
  );

  // --- Admin: list + triage -------------------------------------------------
  r.get(
    "/enquiries",
    {
      preHandler: [app.authenticate, app.requirePermission("enquiry.view")],
      schema: {
        tags,
        summary: "List website enquiries (paginated; filter by status/source)",
        security,
        querystring: listEnquiriesQuery,
        response: { 200: paginatedResponse(enquirySchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.patch(
    "/enquiries/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("enquiry.manage")],
      schema: {
        tags,
        summary: "Update an enquiry's status (NEW → CONTACTED → CLOSED)",
        security,
        params: enquiryIdParams,
        body: updateEnquiryBody,
        response: { 200: dataResponse(enquirySchema), ...commonErrors },
      },
    },
    controller.updateStatus,
  );
}
