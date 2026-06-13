import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta, toSkipTake } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { BadRequest, Conflict, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import { addDuration } from "../../lib/pass.js";
import type { ActorContext } from "../users/users.service.js";
import {
  invoiceInclude,
  invoiceSummaryInclude,
  toInvoiceDto,
  toInvoiceSummaryDto,
} from "./billing.types.js";
import type {
  CatalogItemDto,
  CheckoutInput,
  InvoiceDto,
  InvoiceSummaryDto,
  IssuedPass,
  ListInvoicesQuery,
} from "./billing.types.js";

const MODULE = "billing";
const D = Prisma.Decimal;

export class BillingService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Creates an invoice in a single DB transaction for PRODUCT and/or PASS lines.
   * Validates the payment method + items + stock, computes totals, requires full
   * payment, writes the invoice/items/payment, reduces product stock (+inventory
   * txns), and — only after payment succeeds — issues & activates user passes.
   * Any failure rolls the whole thing back.
   */
  async checkout(
    input: CheckoutInput,
    actor: ActorContext,
  ): Promise<{ invoice: InvoiceDto; change: number; passes: IssuedPass[] }> {
    const keys = input.items.map((i) => `${i.itemType}:${i.id}`);
    if (new Set(keys).size !== keys.length) {
      throw BadRequest("Duplicate items in cart — combine them into one line.");
    }
    for (const it of input.items) {
      if (it.itemType === "PASS" && it.quantity !== 1) {
        throw BadRequest("Each pass is sold individually (quantity 1).");
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Payment method must exist, be active and not soft-deleted.
      const method = await tx.paymentMethod.findFirst({
        where: { id: input.payment.paymentMethodId, deletedAt: null, isActive: true },
      });
      if (!method) throw BadRequest("Selected payment method is not available");

      // 2. Load the products and pass types being sold.
      const productIds = input.items.filter((i) => i.itemType === "PRODUCT").map((i) => i.id);
      const passTypeIds = input.items.filter((i) => i.itemType === "PASS").map((i) => i.id);
      const [products, passTypes] = await Promise.all([
        tx.product.findMany({ where: { id: { in: productIds }, deletedAt: null, status: "ACTIVE" } }),
        tx.passType.findMany({ where: { id: { in: passTypeIds }, deletedAt: null, status: "ACTIVE" } }),
      ]);
      const productById = new Map(products.map((p) => [p.id, p]));
      const passTypeById = new Map(passTypes.map((p) => [p.id, p]));

      // 3. Build line items and roll up totals (Decimal math throughout).
      let subtotal = new D(0);
      let discountTotal = new D(0);
      let taxTotal = new D(0);
      const itemRows: Prisma.InvoiceItemCreateWithoutInvoiceInput[] = [];
      const stockOps: { id: string; name: string; quantity: number }[] = [];
      const passOps: { passType: (typeof passTypes)[number]; original: Prisma.Decimal; discount: Prisma.Decimal; net: Prisma.Decimal }[] = [];

      for (const item of input.items) {
        if (item.itemType === "PRODUCT") {
          const product = productById.get(item.id);
          if (!product) throw BadRequest("One or more products are unavailable or inactive");
          if (product.stockQuantity < item.quantity) {
            throw Conflict(`Insufficient stock for ${product.name} (have ${product.stockQuantity})`);
          }
          const unitPrice = product.sellingPrice;
          const lineGross = unitPrice.mul(item.quantity);
          let lineDiscount = new D(item.discountAmount);
          if (lineDiscount.greaterThan(lineGross)) lineDiscount = lineGross;
          const taxable = lineGross.sub(lineDiscount);
          const lineTax = taxable.mul(product.taxPercentage).div(100).toDecimalPlaces(2);
          const lineTotal = taxable.add(lineTax).toDecimalPlaces(2);

          subtotal = subtotal.add(lineGross);
          discountTotal = discountTotal.add(lineDiscount);
          taxTotal = taxTotal.add(lineTax);
          itemRows.push({
            itemType: "PRODUCT",
            itemId: product.id,
            itemName: product.name,
            quantity: item.quantity,
            unitPrice,
            discountAmount: lineDiscount,
            taxAmount: lineTax,
            totalAmount: lineTotal,
          });
          stockOps.push({ id: product.id, name: product.name, quantity: item.quantity });
        } else {
          const pt = passTypeById.get(item.id);
          if (!pt) throw BadRequest("One or more passes are unavailable or inactive");
          const gross = pt.price;
          // The pass's own built-in discount (NONE / FIXED / PERCENTAGE).
          let discount = new D(0);
          if (pt.discountType === "FIXED") discount = new D(pt.discountValue);
          else if (pt.discountType === "PERCENTAGE") discount = gross.mul(pt.discountValue).div(100);
          if (discount.greaterThan(gross)) discount = gross;
          discount = discount.toDecimalPlaces(2);
          const net = gross.sub(discount).toDecimalPlaces(2);

          subtotal = subtotal.add(gross);
          discountTotal = discountTotal.add(discount);
          // Passes are not taxed.
          itemRows.push({
            itemType: "PASS",
            itemId: pt.id,
            itemName: pt.name,
            quantity: 1,
            unitPrice: gross,
            discountAmount: discount,
            taxAmount: new D(0),
            totalAmount: net,
          });
          passOps.push({ passType: pt, original: gross, discount, net });
        }
      }

      subtotal = subtotal.toDecimalPlaces(2);
      discountTotal = discountTotal.toDecimalPlaces(2);
      taxTotal = taxTotal.toDecimalPlaces(2);
      const total = subtotal.sub(discountTotal).add(taxTotal).toDecimalPlaces(2);

      // 4. Current phase: full payment required.
      const paid = new D(input.payment.paidAmount).toDecimalPlaces(2);
      if (paid.lessThan(total)) {
        throw BadRequest("Full payment is required to complete the sale");
      }
      const change = paid.sub(total);

      // 5. Sequential invoice number, per year — incremented atomically.
      const year = new Date().getFullYear();
      const seq = await tx.invoiceSequence.upsert({
        where: { year },
        create: { year, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });
      const invoiceNo = `INV-${year}-${String(seq.lastNumber).padStart(6, "0")}`;
      const invoiceType =
        stockOps.length > 0 && passOps.length > 0 ? "MIXED" : passOps.length > 0 ? "PASS" : "PRODUCT";

      // 6. Invoice + items.
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          customerId: input.customerId ?? null,
          invoiceType,
          subtotal,
          discountAmount: discountTotal,
          taxAmount: taxTotal,
          totalAmount: total,
          paidAmount: total,
          balanceAmount: new D(0),
          status: "PAID",
          notes: input.notes ?? null,
          createdBy: actor.userId,
          items: { create: itemRows },
        },
      });

      // 7. Payment (full).
      await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          paymentMethodId: method.id,
          amount: total,
          transactionReference: input.payment.transactionReference ?? null,
          remarks: input.payment.remarks ?? null,
          receivedBy: actor.userId,
        },
      });

      // 8. Reduce stock + inventory transactions (decrement-and-verify guards
      // against overselling under concurrent checkouts).
      for (const op of stockOps) {
        const updated = await tx.product.update({
          where: { id: op.id },
          data: { stockQuantity: { decrement: op.quantity } },
          select: { stockQuantity: true, name: true },
        });
        if (updated.stockQuantity < 0) throw Conflict(`Insufficient stock for ${updated.name}`);
        await tx.inventoryTransaction.create({
          data: {
            productId: op.id,
            type: "SALE",
            quantityChange: -op.quantity,
            balanceAfter: updated.stockQuantity,
            referenceType: "invoice",
            referenceId: invoice.id,
            notes: invoiceNo,
            createdBy: actor.userId,
          },
        });
      }

      // 9. Issue + activate passes — only now that payment has succeeded.
      const passes: IssuedPass[] = [];
      const now = new Date();
      for (const op of passOps) {
        const pseq = await tx.passSequence.upsert({
          where: { year },
          create: { year, lastNumber: 1 },
          update: { lastNumber: { increment: 1 } },
        });
        const passNumber = `PASS-${year}-${String(pseq.lastNumber).padStart(6, "0")}`;
        const expiryTime = addDuration(now, op.passType.durationType, op.passType.durationValue);
        const created = await tx.userPass.create({
          data: {
            userId: input.customerId ?? null,
            passTypeId: op.passType.id,
            invoiceId: invoice.id,
            passNumber,
            startTime: now,
            expiryTime,
            originalPrice: op.original,
            discountAmount: op.discount,
            finalAmount: op.net,
            remainingEntries:
              op.passType.entryType === "LIMITED" ? op.passType.allowedEntries : null,
            status: "ACTIVE",
            activatedAt: now,
            createdBy: actor.userId,
          },
        });
        passes.push({
          id: created.id,
          passNumber,
          passTypeName: op.passType.name,
          expiryTime,
        });
      }

      const full = await tx.invoice.findUniqueOrThrow({
        where: { id: invoice.id },
        include: invoiceInclude,
      });
      return { invoice: full, change: change.toNumber(), passes };
    });

    const dto = toInvoiceDto(result.invoice);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.INVOICE_CREATE,
      module: MODULE,
      recordId: dto.id,
      newData: dto,
      ipAddress: actor.ip,
    });
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PAYMENT_RECEIVED,
      module: MODULE,
      recordId: dto.id,
      newData: {
        invoiceNo: dto.invoiceNo,
        amount: dto.totalAmount,
        paymentMethodId: input.payment.paymentMethodId,
      },
      ipAddress: actor.ip,
    });
    for (const p of result.passes) {
      await writeAudit(this.prisma, {
        userId: actor.userId,
        action: AuditAction.PASS_SOLD,
        module: MODULE,
        recordId: p.id,
        newData: { passNumber: p.passNumber, passType: p.passTypeName, invoiceNo: dto.invoiceNo },
        ipAddress: actor.ip,
      });
    }

    return { invoice: dto, change: result.change, passes: result.passes };
  }

  /** Unified POS catalog: active products + active pass types matching `search`. */
  async catalog(search: string | undefined, limit: number): Promise<CatalogItemDto[]> {
    const nameFilter = search
      ? { contains: search, mode: "insensitive" as const }
      : undefined;

    const [products, passTypes] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          ...(search
            ? { OR: [{ name: nameFilter }, { sku: nameFilter }, { barcode: nameFilter }] }
            : {}),
        },
        include: { category: { select: { name: true } } },
        orderBy: { name: "asc" },
        take: limit,
      }),
      this.prisma.passType.findMany({
        where: { deletedAt: null, status: "ACTIVE", ...(search ? { name: nameFilter } : {}) },
        orderBy: { name: "asc" },
        take: limit,
      }),
    ]);

    const productItems: CatalogItemDto[] = products.map((p) => ({
      itemType: "PRODUCT",
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.sellingPrice.toNumber(),
      taxPercentage: p.taxPercentage.toNumber(),
      stockQuantity: p.stockQuantity,
      subtitle: p.category.name,
      imageUrl: p.imageUrl,
    }));

    const passItems: CatalogItemDto[] = passTypes.map((pt) => {
      const gross = pt.price;
      let discount = new D(0);
      if (pt.discountType === "FIXED") discount = new D(pt.discountValue);
      else if (pt.discountType === "PERCENTAGE") discount = gross.mul(pt.discountValue).div(100);
      if (discount.greaterThan(gross)) discount = gross;
      return {
        itemType: "PASS",
        id: pt.id,
        name: pt.name,
        sku: null,
        price: gross.sub(discount).toDecimalPlaces(2).toNumber(),
        taxPercentage: 0,
        stockQuantity: null,
        subtitle: `${pt.type} · ${pt.durationValue} ${pt.durationType.toLowerCase()}${pt.durationValue > 1 ? "s" : ""}`,
        imageUrl: null,
      };
    });

    return [...productItems, ...passItems].slice(0, limit);
  }

  async list(
    query: ListInvoicesQuery,
  ): Promise<{ data: InvoiceSummaryDto[]; meta: { pagination: PaginationMeta } }> {
    const where: Prisma.InvoiceWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.invoiceType) where.invoiceType = query.invoiceType;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        ...(query.dateFrom ? { gte: query.dateFrom } : {}),
        ...(query.dateTo ? { lte: query.dateTo } : {}),
      };
    }
    if (query.search) where.invoiceNo = { contains: query.search, mode: "insensitive" };

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: invoiceSummaryInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: rows.map(toInvoiceSummaryDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async getById(id: string): Promise<InvoiceDto> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
    if (!invoice) throw NotFound("Invoice not found");
    return toInvoiceDto(invoice);
  }

  /** Cancels an invoice and restocks its product lines (with reversal txns). */
  async cancel(id: string, reason: string | null | undefined, actor: ActorContext): Promise<InvoiceDto> {
    const existing = await this.prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) throw NotFound("Invoice not found");
    if (existing.status === "CANCELLED") throw BadRequest("Invoice is already cancelled");
    if (existing.status === "REFUNDED") throw BadRequest("Refunded invoices cannot be cancelled");

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id },
        data: {
          status: "CANCELLED",
          notes: reason ? `${existing.notes ? existing.notes + " | " : ""}Cancelled: ${reason}` : existing.notes,
        },
      });

      // Return product stock and record reversal transactions.
      for (const item of existing.items) {
        if (item.itemType !== "PRODUCT") continue;
        const product = await tx.product.update({
          where: { id: item.itemId },
          data: { stockQuantity: { increment: item.quantity } },
          select: { stockQuantity: true },
        });
        await tx.inventoryTransaction.create({
          data: {
            productId: item.itemId,
            type: "SALE_REVERSAL",
            quantityChange: item.quantity,
            balanceAfter: product.stockQuantity,
            referenceType: "invoice-cancel",
            referenceId: id,
            notes: existing.invoiceNo,
            createdBy: actor.userId,
          },
        });
      }

      // Cancel any passes this invoice issued.
      await tx.userPass.updateMany({
        where: { invoiceId: id, status: { not: "CANCELLED" } },
        data: { status: "CANCELLED" },
      });

      return tx.invoice.findUniqueOrThrow({ where: { id }, include: invoiceInclude });
    });

    const dto = toInvoiceDto(updated);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.INVOICE_CANCEL,
      module: MODULE,
      recordId: id,
      oldData: { status: existing.status },
      newData: { status: dto.status, reason: reason ?? null },
      ipAddress: actor.ip,
    });
    return dto;
  }

  /** Builds the printable receipt payload (company + cashier + invoice). */
  async receipt(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
    if (!invoice) throw NotFound("Invoice not found");

    const company = await this.prisma.companySetting.findFirst();
    const cashier = invoice.createdBy
      ? await this.prisma.user.findUnique({
          where: { id: invoice.createdBy },
          select: { firstName: true, lastName: true },
        })
      : null;
    const dto = toInvoiceDto(invoice);

    return {
      company: {
        name: company?.name ?? "Aqua Lagoon",
        tagline: company?.tagline ?? null,
        address: company?.address ?? null,
        phone: company?.phone ?? null,
        email: company?.email ?? null,
      },
      invoiceNo: dto.invoiceNo,
      invoiceDate: invoice.createdAt,
      status: dto.status,
      cashierName: cashier ? `${cashier.firstName} ${cashier.lastName}` : null,
      customerId: dto.customerId,
      items: dto.items.map((it) => ({
        name: it.itemName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountAmount: it.discountAmount,
        taxAmount: it.taxAmount,
        totalAmount: it.totalAmount,
      })),
      subtotal: dto.subtotal,
      discountAmount: dto.discountAmount,
      taxAmount: dto.taxAmount,
      totalAmount: dto.totalAmount,
      paidAmount: dto.paidAmount,
      balanceAmount: dto.balanceAmount,
      payments: dto.payments.map((p) => ({
        methodName: p.paymentMethodName,
        amount: p.amount,
        transactionReference: p.transactionReference,
      })),
    };
  }
}
