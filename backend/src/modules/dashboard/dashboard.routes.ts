import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { commonErrors } from "../../lib/response.js";
import { DashboardService } from "./dashboard.service.js";
import {
  limitQuery,
  limitRangeQuery,
  lowStockResponse,
  overviewResponse,
  passesByTypeResponse,
  paymentsByMethodResponse,
  rangeQuery,
  recentEnrollmentsResponse,
  recentInvoicesResponse,
  revenueBreakdownResponse,
  salesSummaryResponse,
  topPassBuyersResponse,
  topProductsResponse,
} from "./dashboard.schema.js";

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const service = new DashboardService(app.prisma);

  const tags = ["dashboard"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/dashboard/overview",
    {
      preHandler: [app.authenticate, app.requirePermission("dashboard.view")],
      schema: {
        tags,
        summary: "All dashboard data in one payload for a date range (default today)",
        security,
        querystring: rangeQuery,
        response: { 200: overviewResponse, ...commonErrors },
      },
    },
    async (request) => ({ data: await service.overview(request.query) }),
  );

  r.get(
    "/dashboard/sales-summary",
    {
      preHandler: [app.authenticate, app.requirePermission("dashboard.view")],
      schema: {
        tags,
        summary: "Sales, revenue and invoice count for a date range (default today)",
        security,
        querystring: rangeQuery,
        response: { 200: salesSummaryResponse, ...commonErrors },
      },
    },
    async (request) => ({ data: await service.salesSummary(request.query) }),
  );

  r.get(
    "/dashboard/revenue-breakdown",
    {
      preHandler: [app.authenticate, app.requirePermission("dashboard.view")],
      schema: {
        tags,
        summary: "Revenue split into products vs passes for a date range (default today)",
        security,
        querystring: rangeQuery,
        response: { 200: revenueBreakdownResponse, ...commonErrors },
      },
    },
    async (request) => ({ data: await service.revenueBreakdown(request.query) }),
  );

  r.get(
    "/dashboard/top-products",
    {
      preHandler: [app.authenticate, app.requirePermission("dashboard.view")],
      schema: {
        tags,
        summary: "Top selling products by units sold",
        security,
        querystring: limitRangeQuery,
        response: { 200: topProductsResponse, ...commonErrors },
      },
    },
    async (request) => ({
      data: await service.topProducts(request.query.limit, request.query),
    }),
  );

  r.get(
    "/dashboard/recent-invoices",
    {
      preHandler: [app.authenticate, app.requirePermission("dashboard.view")],
      schema: {
        tags,
        summary: "Most recent invoices",
        security,
        querystring: limitRangeQuery,
        response: { 200: recentInvoicesResponse, ...commonErrors },
      },
    },
    async (request) => ({
      data: await service.recentInvoices(request.query.limit, request.query),
    }),
  );

  r.get(
    "/dashboard/payments-by-method",
    {
      preHandler: [app.authenticate, app.requirePermission("dashboard.view")],
      schema: {
        tags,
        summary: "Amount received per payment method for a date range (default today)",
        security,
        querystring: rangeQuery,
        response: { 200: paymentsByMethodResponse, ...commonErrors },
      },
    },
    async (request) => ({ data: await service.paymentsByMethod(request.query) }),
  );

  r.get(
    "/dashboard/passes-by-type",
    {
      preHandler: [app.authenticate, app.requirePermission("dashboard.view")],
      schema: {
        tags,
        summary: "Passes issued per type for a date range (default today)",
        security,
        querystring: rangeQuery,
        response: { 200: passesByTypeResponse, ...commonErrors },
      },
    },
    async (request) => ({ data: await service.passesByType(request.query) }),
  );

  r.get(
    "/dashboard/top-pass-buyers",
    {
      preHandler: [app.authenticate, app.requirePermission("dashboard.view")],
      schema: {
        tags,
        summary: "Top pass buyers for a date range (default today)",
        security,
        querystring: limitRangeQuery,
        response: { 200: topPassBuyersResponse, ...commonErrors },
      },
    },
    async (request) => ({
      data: await service.topPassBuyers(request.query.limit, request.query),
    }),
  );

  r.get(
    "/dashboard/recent-enrollments",
    {
      preHandler: [app.authenticate, app.requirePermission("dashboard.view")],
      schema: {
        tags,
        summary: "Most recent student admissions for a date range (default today)",
        security,
        querystring: limitRangeQuery,
        response: { 200: recentEnrollmentsResponse, ...commonErrors },
      },
    },
    async (request) => ({
      data: await service.recentEnrollments(request.query.limit, request.query),
    }),
  );

  r.get(
    "/dashboard/low-stock",
    {
      preHandler: [app.authenticate, app.requirePermission("dashboard.view")],
      schema: {
        tags,
        summary: "Active products at or below minimum stock",
        security,
        querystring: limitQuery,
        response: { 200: lowStockResponse, ...commonErrors },
      },
    },
    async (request) => ({ data: await service.lowStock(request.query.limit) }),
  );
}
