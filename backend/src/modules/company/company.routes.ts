import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { commonErrors } from "../../lib/response.js";
import { CompanyService } from "./company.service.js";
import { createCompanyController } from "./company.controller.js";
import { companyResponse, updateCompanyBody } from "./company.schema.js";

export async function companyRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createCompanyController(new CompanyService(app.prisma, app.storage));

  const tags = ["company"];
  const security = [{ bearerAuth: [] }];

  // Any authenticated user can read company branding/contact info.
  r.get(
    "/company",
    {
      preHandler: [app.authenticate],
      schema: {
        tags,
        summary: "Get the company profile",
        security,
        response: { 200: companyResponse, ...commonErrors },
      },
    },
    controller.get,
  );

  r.put(
    "/company",
    {
      preHandler: [app.authenticate, app.requirePermission("setting.manage")],
      schema: {
        tags,
        summary: "Update the company profile (admin)",
        security,
        body: updateCompanyBody,
        response: { 200: companyResponse, ...commonErrors },
      },
    },
    controller.update,
  );

  r.post(
    "/company/logo",
    {
      preHandler: [app.authenticate, app.requirePermission("setting.manage")],
      schema: {
        tags,
        summary: "Upload the company logo (multipart/form-data, admin)",
        security,
        consumes: ["multipart/form-data"],
        response: { 200: companyResponse, ...commonErrors },
      },
    },
    controller.uploadLogo,
  );
}
