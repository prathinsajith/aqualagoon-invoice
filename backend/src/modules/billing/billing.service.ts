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
    // Only one pass (type) may be sold per sale; its quantity can still be > 1.
    if (input.items.filter((i) => i.itemType === "PASS").length > 1) {
      throw BadRequest("Only one pass can be sold per sale.");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Payment method must exist, be active and not soft-deleted.
      const method = await tx.paymentMethod.findFirst({
        where: { id: input.payment.paymentMethodId, deletedAt: null, isActive: true },
      });
      if (!method) throw BadRequest("Selected payment method is not available");

      // 2. Load the products, pass types and student fees being sold.
      const productIds = input.items.filter((i) => i.itemType === "PRODUCT").map((i) => i.id);
      const passTypeIds = input.items.filter((i) => i.itemType === "PASS").map((i) => i.id);
      const feeIds = input.items.filter((i) => i.itemType === "TRAINING").map((i) => i.id);
      const [products, passTypes, fees] = await Promise.all([
        tx.product.findMany({ where: { id: { in: productIds }, deletedAt: null, status: "ACTIVE" } }),
        tx.passType.findMany({ where: { id: { in: passTypeIds }, deletedAt: null, status: "ACTIVE" } }),
        tx.studentFee.findMany({
          where: { id: { in: feeIds } },
          include: {
            feePlan: { select: { name: true } },
            enrollment: { select: { batch: { select: { program: { select: { name: true } } } } } },
          },
        }),
      ]);
      const productById = new Map(products.map((p) => [p.id, p]));
      const passTypeById = new Map(passTypes.map((p) => [p.id, p]));
      const feeById = new Map(fees.map((f) => [f.id, f]));
      // Fees settled by this sale — marked PAID after the invoice is written.
      const feeOps: { id: string; name: string }[] = [];

      // 3. Build line items and roll up totals (Decimal math throughout).
      let subtotal = new D(0);
      let discountTotal = new D(0);
      let taxTotal = new D(0);
      const itemRows: Prisma.InvoiceItemCreateWithoutInvoiceInput[] = [];
      const stockOps: { id: string; name: string; quantity: number }[] = [];
      const passOps: { passType: (typeof passTypes)[number]; quantity: number; original: Prisma.Decimal; discount: Prisma.Decimal; net: Prisma.Decimal }[] = [];

      for (const item of input.items) {
        if (item.itemType === "TRAINING") {
          const fee = feeById.get(item.id);
          if (!fee) throw BadRequest("One or more training fees are unavailable");
          if (fee.status === "PAID") throw BadRequest("This training fee is already paid");
          // Charge the outstanding balance (the POS clears the fee in full);
          // training fees are untaxed and always quantity 1.
          const net = fee.finalAmount.sub(fee.paidAmount);
          if (net.lessThanOrEqualTo(0)) throw BadRequest("This training fee has no balance due");
          const name = fee.feePlan?.name ?? fee.enrollment.batch.program.name ?? "Training fee";
          subtotal = subtotal.add(net);
          itemRows.push({
            itemType: "TRAINING",
            itemId: fee.id,
            itemName: name,
            quantity: 1,
            unitPrice: net,
            discountAmount: new D(0),
            taxAmount: new D(0),
            totalAmount: net,
          });
          feeOps.push({ id: fee.id, name });
        } else if (item.itemType === "PRODUCT") {
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
          // A student pass is an individual membership — only one per sale.
          if (pt.type === "STUDENT" && item.quantity !== 1) {
            throw BadRequest("A student pass can only be bought one at a time.");
          }
          const gross = pt.price;
          // The pass's own built-in discount (NONE / FIXED / PERCENTAGE).
          let discount = new D(0);
          if (pt.discountType === "FIXED") discount = new D(pt.discountValue);
          else if (pt.discountType === "PERCENTAGE") discount = gross.mul(pt.discountValue).div(100);
          if (discount.greaterThan(gross)) discount = gross;
          discount = discount.toDecimalPlaces(2);
          const net = gross.sub(discount).toDecimalPlaces(2);
          // A guest may buy several of the same pass at once; each becomes its
          // own pass (own number) but they share one validity window.
          const qty = item.quantity;
          const lineGross = gross.mul(qty);
          const lineDiscount = discount.mul(qty);
          const lineNet = net.mul(qty);

          subtotal = subtotal.add(lineGross);
          discountTotal = discountTotal.add(lineDiscount);
          // Passes are not taxed.
          itemRows.push({
            itemType: "PASS",
            itemId: pt.id,
            itemName: pt.name,
            quantity: qty,
            unitPrice: gross,
            discountAmount: lineDiscount,
            taxAmount: new D(0),
            totalAmount: lineNet,
          });
          passOps.push({ passType: pt, quantity: qty, original: gross, discount, net });
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
      // Company-configured prefixes for generated numbers (fall back to defaults).
      const company = await tx.companySetting.findFirst({
        select: { invoicePrefix: true, passPrefix: true },
      });
      const invoicePrefix = company?.invoicePrefix || "INV";
      const passPrefix = company?.passPrefix || "PASS";
      const seq = await tx.invoiceSequence.upsert({
        where: { year },
        create: { year, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });
      const invoiceNo = `${invoicePrefix}-${year}-${String(seq.lastNumber).padStart(6, "0")}`;
      // Classify the invoice by which streams it contains; more than one → MIXED.
      const hasProduct = stockOps.length > 0;
      const hasPass = passOps.length > 0;
      const hasTraining = feeOps.length > 0;
      const streamCount = [hasProduct, hasPass, hasTraining].filter(Boolean).length;
      const invoiceType =
        streamCount > 1 ? "MIXED" : hasPass ? "PASS" : hasTraining ? "TRAINING" : "PRODUCT";

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

      // 8. Reduce stock + inventory transactions. The decrement-and-verify must
      // stay per-product (atomic decrement guards against overselling under
      // concurrent checkouts), but the matching inventory-transaction rows are
      // collected and written in a single createMany (2N → N+1 queries).
      const inventoryRows: Prisma.InventoryTransactionCreateManyInput[] = [];
      for (const op of stockOps) {
        const updated = await tx.product.update({
          where: { id: op.id },
          data: { stockQuantity: { decrement: op.quantity } },
          select: { stockQuantity: true, name: true },
        });
        if (updated.stockQuantity < 0) throw Conflict(`Insufficient stock for ${updated.name}`);
        inventoryRows.push({
          productId: op.id,
          type: "SALE",
          quantityChange: -op.quantity,
          balanceAfter: updated.stockQuantity,
          referenceType: "invoice",
          referenceId: invoice.id,
          notes: invoiceNo,
          createdBy: actor.userId,
        });
      }
      if (inventoryRows.length > 0) {
        await tx.inventoryTransaction.createMany({ data: inventoryRows });
      }

      // 9. Issue + activate passes — only now that payment has succeeded.
      const passes: IssuedPass[] = [];
      const now = new Date();
      const holderName = input.holderName?.trim() || null;
      // Reserve the whole block of pass numbers in ONE sequence bump (instead
      // of one upsert per pass copy) — fewer round-trips and far less lock
      // contention on the per-year counter row — then hand them out locally.
      const totalPassQty = passOps.reduce((sum, op) => sum + op.quantity, 0);
      let nextPassNumber = 0;
      if (totalPassQty > 0) {
        const pseq = await tx.passSequence.upsert({
          where: { year },
          create: { year, lastNumber: totalPassQty },
          update: { lastNumber: { increment: totalPassQty } },
        });
        // lastNumber is the highest reserved; our block is the trailing range.
        nextPassNumber = pseq.lastNumber - totalPassQty + 1;
      }
      for (const op of passOps) {
        // All copies of this pass share the same start/expiry window.
        const expiryTime = addDuration(now, op.passType.durationType, op.passType.durationValue);
        for (let i = 0; i < op.quantity; i++) {
          const passNumber = `${passPrefix}-${year}-${String(nextPassNumber).padStart(6, "0")}`;
          nextPassNumber++;
          // A single-entry pass is consumed the moment it's issued — taking the
          // pass IS the one entry, so it starts with 0 left and the entry is logged.
          const isSingleEntry =
            op.passType.entryType === "LIMITED" && op.passType.allowedEntries === 1;
          const created = await tx.userPass.create({
            data: {
              userId: input.customerId ?? null,
              holderName,
              passTypeId: op.passType.id,
              invoiceId: invoice.id,
              passNumber,
              startTime: now,
              expiryTime,
              originalPrice: op.original,
              discountAmount: op.discount,
              finalAmount: op.net,
              remainingEntries:
                op.passType.entryType === "LIMITED"
                  ? isSingleEntry
                    ? 0
                    : op.passType.allowedEntries
                  : null,
              status: "ACTIVE",
              activatedAt: now,
              createdBy: actor.userId,
            },
          });
          if (isSingleEntry) {
            await tx.passUsageLog.create({
              data: {
                userPassId: created.id,
                userId: input.customerId ?? null,
                entryTime: now,
                remarks: "Entry recorded on issue (single-entry pass)",
              },
            });
          }
          passes.push({
            id: created.id,
            passNumber,
            passTypeName: op.passType.name,
            holderName,
            expiryTime,
          });
        }
      }

      // 10. Settle training fees — mark PAID and link to this invoice.
      for (const op of feeOps) {
        const fee = feeById.get(op.id)!;
        await tx.studentFee.update({
          where: { id: op.id },
          data: { status: "PAID", paidAmount: fee.finalAmount, invoiceId: invoice.id },
        });
      }

      const full = await tx.invoice.findUniqueOrThrow({
        where: { id: invoice.id },
        include: invoiceInclude,
      });
      return { invoice: full, change: change.toNumber(), passes, feeOps };
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
    // Per-pass and per-fee audit entries are independent — write them in
    // parallel instead of one serial round-trip each.
    await Promise.all([
      ...result.passes.map((p) =>
        writeAudit(this.prisma, {
          userId: actor.userId,
          action: AuditAction.PASS_SOLD,
          module: MODULE,
          recordId: p.id,
          newData: { passNumber: p.passNumber, passType: p.passTypeName, invoiceNo: dto.invoiceNo },
          ipAddress: actor.ip,
        }),
      ),
      ...result.feeOps.map((f) =>
        writeAudit(this.prisma, {
          userId: actor.userId,
          action: AuditAction.FEE_PAID,
          module: MODULE,
          recordId: f.id,
          newData: { fee: f.name, invoiceNo: dto.invoiceNo },
          ipAddress: actor.ip,
        }),
      ),
    ]);

    return { invoice: dto, change: result.change, passes: result.passes };
  }

  /** Unified POS catalog: active products + active pass types matching `search`. */
  async catalog(
    search: string | undefined,
    limit: number,
    customerId?: string,
  ): Promise<CatalogItemDto[]> {
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
      passKind: null,
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
        passKind: pt.type,
      };
    });

    // Outstanding training fees for the selected customer — sold as TRAINING
    // line items. Only when a customer is chosen (fees are per-student).
    let feeItems: CatalogItemDto[] = [];
    if (customerId) {
      const fees = await this.prisma.studentFee.findMany({
        where: {
          studentId: customerId,
          status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
        },
        include: {
          feePlan: { select: { name: true } },
          enrollment: { select: { batch: { select: { program: { select: { name: true } } } } } },
        },
        orderBy: { createdAt: "asc" },
      });
      feeItems = fees
        // The POS collects the outstanding balance, not the original total.
        .map((f) => ({ f, balance: f.finalAmount.sub(f.paidAmount) }))
        .filter(({ balance }) => balance.greaterThan(0))
        .map(({ f, balance }) => {
          const label = f.feePlan?.name ?? f.enrollment.batch.program.name ?? "Training fee";
          const partial = f.paidAmount.greaterThan(0);
          return {
            itemType: "TRAINING" as const,
            id: f.id,
            name: label,
            sku: null,
            price: balance.toNumber(),
            taxPercentage: 0,
            stockQuantity: null,
            subtitle: partial
              ? `Balance due${f.dueDate ? ` · ${f.dueDate.toISOString().slice(0, 10)}` : ""}`
              : f.dueDate
                ? `Fee · due ${f.dueDate.toISOString().slice(0, 10)}`
                : "Training fee",
            imageUrl: null,
            passKind: null,
          };
        });
    }

    return [...feeItems, ...productItems, ...passItems].slice(0, limit + feeItems.length);
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

      // Reverse training-fee payments this invoice collected: subtract exactly
      // what each line paid (supports partial payments), recompute status, and
      // unlink the fee if it pointed at this invoice. Prefetch every affected
      // fee in one query (instead of N findUnique calls), then apply the
      // independent updates in parallel.
      const trainingItems = existing.items.filter((item) => item.itemType === "TRAINING");
      if (trainingItems.length > 0) {
        const fees = await tx.studentFee.findMany({
          where: { id: { in: trainingItems.map((item) => item.itemId) } },
        });
        const feeById = new Map(fees.map((f) => [f.id, f]));
        await Promise.all(
          trainingItems.map((item) => {
            const fee = feeById.get(item.itemId);
            if (!fee) return Promise.resolve();
            const paid = fee.paidAmount.sub(item.totalAmount);
            const newPaid = paid.lessThan(0) ? new D(0) : paid;
            const status = newPaid.greaterThanOrEqualTo(fee.finalAmount)
              ? "PAID"
              : newPaid.greaterThan(0)
                ? "PARTIAL"
                : "PENDING";
            return tx.studentFee.update({
              where: { id: fee.id },
              data: {
                paidAmount: newPaid,
                status,
                invoiceId: fee.invoiceId === id ? null : fee.invoiceId,
              },
            });
          }),
        );
      }

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

  /**
   * Collects a payment against a single training fee — supports paying the
   * balance in instalments. Creates a paid TRAINING invoice for `amount`, bumps
   * the fee's paidAmount, recomputes its status (PARTIAL until fully paid), and
   * returns the invoice so the desk can print a bill.
   */
  async payFee(
    feeId: string,
    amount: number,
    paymentMethodId: string,
    actor: ActorContext,
  ): Promise<InvoiceDto> {
    const amt = new D(amount).toDecimalPlaces(2);
    if (amt.lessThanOrEqualTo(0)) throw BadRequest("Payment amount must be greater than zero");

    const result = await this.prisma.$transaction(async (tx) => {
      const method = await tx.paymentMethod.findFirst({
        where: { id: paymentMethodId, deletedAt: null, isActive: true },
      });
      if (!method) throw BadRequest("Selected payment method is not available");

      const fee = await tx.studentFee.findUnique({
        where: { id: feeId },
        include: {
          feePlan: { select: { name: true } },
          enrollment: {
            select: { studentId: true, batch: { select: { program: { select: { name: true } } } } },
          },
        },
      });
      if (!fee) throw NotFound("Student fee not found");
      const balance = fee.finalAmount.sub(fee.paidAmount);
      if (balance.lessThanOrEqualTo(0)) throw BadRequest("This fee is already fully paid");
      if (amt.greaterThan(balance)) {
        throw BadRequest(`Amount exceeds the balance due (${balance.toFixed(2)})`);
      }

      const name = fee.feePlan?.name ?? fee.enrollment.batch.program.name ?? "Training fee";
      const year = new Date().getFullYear();
      const company = await tx.companySetting.findFirst({ select: { invoicePrefix: true } });
      const prefix = company?.invoicePrefix || "INV";
      const seq = await tx.invoiceSequence.upsert({
        where: { year },
        create: { year, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });
      const invoiceNo = `${prefix}-${year}-${String(seq.lastNumber).padStart(6, "0")}`;

      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          customerId: fee.enrollment.studentId,
          invoiceType: "TRAINING",
          subtotal: amt,
          discountAmount: new D(0),
          taxAmount: new D(0),
          totalAmount: amt,
          paidAmount: amt,
          balanceAmount: new D(0),
          status: "PAID",
          createdBy: actor.userId,
          items: {
            create: [
              {
                itemType: "TRAINING",
                itemId: fee.id,
                itemName: name,
                quantity: 1,
                unitPrice: amt,
                discountAmount: new D(0),
                taxAmount: new D(0),
                totalAmount: amt,
              },
            ],
          },
        },
      });
      await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          paymentMethodId: method.id,
          amount: amt,
          receivedBy: actor.userId,
        },
      });

      const newPaid = fee.paidAmount.add(amt);
      const status = newPaid.greaterThanOrEqualTo(fee.finalAmount) ? "PAID" : "PARTIAL";
      await tx.studentFee.update({
        where: { id: fee.id },
        data: { paidAmount: newPaid, status, invoiceId: invoice.id },
      });

      const full = await tx.invoice.findUniqueOrThrow({
        where: { id: invoice.id },
        include: invoiceInclude,
      });
      return { invoice: full, feeName: name };
    });

    const dto = toInvoiceDto(result.invoice);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PAYMENT_RECEIVED,
      module: MODULE,
      recordId: dto.id,
      newData: { invoiceNo: dto.invoiceNo, amount: amt.toNumber(), paymentMethodId },
      ipAddress: actor.ip,
    });
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.FEE_PAID,
      module: MODULE,
      recordId: feeId,
      newData: { fee: result.feeName, amount: amt.toNumber(), invoiceNo: dto.invoiceNo },
      ipAddress: actor.ip,
    });
    return dto;
  }

  /** Builds the printable receipt payload (company + cashier + invoice). */
  async receipt(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
    if (!invoice) throw NotFound("Invoice not found");

    // Company profile and cashier are independent — fetch them in parallel.
    const [company, cashier] = await Promise.all([
      this.prisma.companySetting.findFirst(),
      invoice.createdBy
        ? this.prisma.user.findUnique({
            where: { id: invoice.createdBy },
            select: { firstName: true, lastName: true },
          })
        : Promise.resolve(null),
    ]);
    const dto = toInvoiceDto(invoice);

    return {
      company: {
        name: company?.name ?? "Aqua Lagoon",
        tagline: company?.tagline ?? null,
        address: company?.address ?? null,
        phone: company?.phone ?? null,
        email: company?.email ?? null,
        logoUrl: company?.logoUrl ?? null,
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
