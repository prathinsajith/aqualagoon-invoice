import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { BillingService } from "./billing.service.js";
import { createBillingController } from "./billing.controller.js";
import {
  cancelInvoiceBody,
  catalogQuery,
  catalogResponse,
  checkoutBody,
  checkoutResponse,
  invoiceIdParams,
  invoiceSchema,
  invoiceSummarySchema,
  listInvoicesQuery,
  receiptSchema,
} from "./billing.schema.js";

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createBillingController(new BillingService(app.prisma));

  const security = [{ bearerAuth: [] }];

  // --- POS catalog (products + passes) --------------------------------------
  r.get(
    "/billing/items",
    {
      preHandler: [app.authenticate, app.requirePermission("billing.create")],
      schema: {
        tags: ["billing"],
        summary: "Search sellable items (products + active passes) for the POS",
        security,
        querystring: catalogQuery,
        response: { 200: catalogResponse, ...commonErrors },
      },
    },
    controller.catalog,
  );

  // --- POS checkout ---------------------------------------------------------
  r.post(
    "/billing/checkout",
    {
      preHandler: [app.authenticate, app.requirePermission("billing.create")],
      schema: {
        tags: ["billing"],
        summary: "Create a product invoice (POS checkout — atomic)",
        security,
        body: checkoutBody,
        response: { 201: checkoutResponse, ...commonErrors },
      },
    },
    controller.checkout,
  );

  // --- Invoices -------------------------------------------------------------
  const invoiceTags = ["invoices"];

  r.get(
    "/invoices",
    {
      preHandler: [app.authenticate, app.requirePermission("invoice.view")],
      schema: {
        tags: invoiceTags,
        summary: "List invoices (paginated, searchable, filterable)",
        security,
        querystring: listInvoicesQuery,
        response: { 200: paginatedResponse(invoiceSummarySchema), ...commonErrors },
      },
    },
    controller.listInvoices,
  );

  r.get(
    "/invoices/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("invoice.view")],
      schema: {
        tags: invoiceTags,
        summary: "Get an invoice by id (with items + payments)",
        security,
        params: invoiceIdParams,
        response: { 200: dataResponse(invoiceSchema), ...commonErrors },
      },
    },
    controller.getInvoice,
  );

  r.post(
    "/invoices/:id/cancel",
    {
      preHandler: [app.authenticate, app.requirePermission("billing.cancel")],
      schema: {
        tags: invoiceTags,
        summary: "Cancel an invoice and restock its products",
        security,
        params: invoiceIdParams,
        body: cancelInvoiceBody,
        response: { 200: dataResponse(invoiceSchema), ...commonErrors },
      },
    },
    controller.cancelInvoice,
  );

  r.get(
    "/invoices/:id/receipt",
    {
      preHandler: [app.authenticate, app.requirePermission("invoice.print")],
      schema: {
        tags: invoiceTags,
        summary: "Get printable receipt data for an invoice",
        security,
        params: invoiceIdParams,
        response: { 200: receiptSchema, ...commonErrors },
      },
    },
    controller.receipt,
  );
}
