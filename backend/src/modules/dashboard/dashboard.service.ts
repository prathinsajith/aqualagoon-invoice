import type { PrismaClient } from "../../generated/prisma/client.js";
import { invoiceSummaryInclude, toInvoiceSummaryDto } from "../billing/billing.types.js";
import type { InvoiceSummaryDto } from "../billing/billing.types.js";

export interface SalesSummary {
  invoices: number;
  revenue: number;
  itemsSold: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
  /** Current stock on hand, or null if the product no longer exists. */
  stockRemaining: number | null;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  minimumStock: number;
}

export interface PaymentMethodTotal {
  paymentMethodId: string;
  name: string;
  amount: number;
}

export interface PassTypeTotal {
  passTypeId: string;
  name: string;
  /** Number of passes issued in the range. */
  count: number;
  /** Revenue from those passes (sum of final amount). */
  revenue: number;
}

export interface TopPassBuyer {
  /** Registered holder id, or null for a walk-in (named) buyer. */
  userId: string | null;
  name: string;
  /** The buyer's uploaded photo (registered users only), else null. */
  photoUrl: string | null;
  /** Passes bought in the range. */
  passCount: number;
  /** Total spent on those passes. */
  totalSpent: number;
}

/** Inclusive date window used to scope dashboard analytics. */
export interface DateRange {
  from?: Date;
  to?: Date;
}

export class DashboardService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Builds a Prisma date filter from a range. When neither bound is given it
   * falls back to "today" (start of the current day onward) when `defaultToday`
   * is set, otherwise returns undefined (no date constraint).
   */
  private dateFilter(
    range: DateRange | undefined,
    defaultToday: boolean,
  ): { gte?: Date; lte?: Date } | undefined {
    if (range?.from || range?.to) {
      return {
        ...(range.from ? { gte: range.from } : {}),
        ...(range.to ? { lte: range.to } : {}),
      };
    }
    if (!defaultToday) return undefined;
    const now = new Date();
    return { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
  }

  /** Amount received in the range, grouped by payment method (excludes cancelled). */
  async paymentsByMethod(range?: DateRange): Promise<PaymentMethodTotal[]> {
    const paymentDate = this.dateFilter(range, true);
    const rows = await this.prisma.payment.groupBy({
      by: ["paymentMethodId"],
      where: {
        ...(paymentDate ? { paymentDate } : {}),
        invoice: { status: { not: "CANCELLED" } },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    });
    if (rows.length === 0) return [];

    const methods = await this.prisma.paymentMethod.findMany({
      where: { id: { in: rows.map((r) => r.paymentMethodId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(methods.map((m) => [m.id, m.name]));

    return rows.map((r) => ({
      paymentMethodId: r.paymentMethodId,
      name: nameById.get(r.paymentMethodId) ?? "Unknown",
      amount: r._sum.amount?.toNumber() ?? 0,
    }));
  }

  /**
   * Revenue split by what was sold — products vs passes — for the range
   * (defaults to today; excludes cancelled invoices). Summing invoice-item
   * totals keeps each stream isolated (product totals include their tax; passes
   * are untaxed), and `total` is their sum.
   */
  async revenueBreakdown(
    range?: DateRange,
  ): Promise<{ product: number; pass: number; training: number; total: number }> {
    const createdAt = this.dateFilter(range, true);
    const rows = await this.prisma.invoiceItem.groupBy({
      by: ["itemType"],
      where: {
        invoice: { status: { not: "CANCELLED" }, ...(createdAt ? { createdAt } : {}) },
      },
      _sum: { totalAmount: true },
    });

    let product = 0;
    let pass = 0;
    let training = 0;
    for (const r of rows) {
      const amount = r._sum.totalAmount?.toNumber() ?? 0;
      if (r.itemType === "PRODUCT") product += amount;
      else if (r.itemType === "PASS") pass += amount;
      else if (r.itemType === "TRAINING") training += amount;
    }
    return { product, pass, training, total: product + pass + training };
  }

  /** Most recent enrollments (admissions) in the range (defaults to today). */
  async recentEnrollments(
    limit: number,
    range?: DateRange,
  ): Promise<
    {
      id: string;
      studentId: string;
      studentName: string;
      studentPhotoUrl: string | null;
      batchName: string;
      programName: string;
      joinedDate: Date;
      billed: number;
      paid: number;
      balance: number;
    }[]
  > {
    const createdAt = this.dateFilter(range, true);
    const rows = await this.prisma.studentEnrollment.findMany({
      where: { ...(createdAt ? { createdAt } : {}), status: { not: "DROPPED" } },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        batch: { select: { name: true, program: { select: { name: true } } } },
        studentFees: { select: { finalAmount: true, paidAmount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((e) => {
      let billed = 0;
      let paid = 0;
      for (const f of e.studentFees) {
        billed += f.finalAmount.toNumber();
        paid += f.paidAmount.toNumber();
      }
      return {
        id: e.id,
        studentId: e.student.id,
        studentName: `${e.student.firstName} ${e.student.lastName}`.trim(),
        studentPhotoUrl: e.student.photoUrl,
        batchName: e.batch.name,
        programName: e.batch.program.name,
        joinedDate: e.joinedDate,
        billed,
        paid,
        balance: Math.max(0, billed - paid),
      };
    });
  }

  /** Passes issued in the range, grouped by pass type (defaults to today; excludes cancelled). */
  async passesByType(range?: DateRange): Promise<PassTypeTotal[]> {
    const createdAt = this.dateFilter(range, true);
    const rows = await this.prisma.userPass.groupBy({
      by: ["passTypeId"],
      where: {
        ...(createdAt ? { createdAt } : {}),
        status: { not: "CANCELLED" },
      },
      _count: { _all: true },
      _sum: { finalAmount: true },
      orderBy: { _count: { passTypeId: "desc" } },
    });
    if (rows.length === 0) return [];

    const types = await this.prisma.passType.findMany({
      where: { id: { in: rows.map((r) => r.passTypeId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(types.map((t) => [t.id, t.name]));

    return rows.map((r) => ({
      passTypeId: r.passTypeId,
      name: nameById.get(r.passTypeId) ?? "Unknown",
      count: r._count._all,
      revenue: r._sum.finalAmount?.toNumber() ?? 0,
    }));
  }

  /** Top pass buyers in the range by number of passes bought (defaults to today). */
  async topPassBuyers(limit: number, range?: DateRange): Promise<TopPassBuyer[]> {
    const createdAt = this.dateFilter(range, true);
    const rows = await this.prisma.userPass.findMany({
      where: {
        ...(createdAt ? { createdAt } : {}),
        status: { not: "CANCELLED" },
      },
      select: {
        userId: true,
        holderName: true,
        finalAmount: true,
        user: { select: { firstName: true, lastName: true, photoUrl: true } },
      },
    });

    // Aggregate per holder — registered users key on their id, walk-ins on their
    // captured name so each named buyer is counted separately.
    const byBuyer = new Map<string, TopPassBuyer>();
    for (const r of rows) {
      const key = r.userId ?? `walk-in:${r.holderName ?? "Unknown"}`;
      const name = r.user
        ? `${r.user.firstName} ${r.user.lastName}`.trim()
        : r.holderName ?? "Walk-in";
      const existing = byBuyer.get(key);
      if (existing) {
        existing.passCount += 1;
        existing.totalSpent += r.finalAmount.toNumber();
      } else {
        byBuyer.set(key, {
          userId: r.userId,
          name,
          photoUrl: r.user?.photoUrl ?? null,
          passCount: 1,
          totalSpent: r.finalAmount.toNumber(),
        });
      }
    }

    return [...byBuyer.values()]
      .sort((a, b) => b.passCount - a.passCount || b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  /** Sales metrics for the range (defaults to today; excludes cancelled invoices). */
  async salesSummary(range?: DateRange): Promise<SalesSummary> {
    const createdAt = this.dateFilter(range, true);
    const where = {
      ...(createdAt ? { createdAt } : {}),
      status: { not: "CANCELLED" as const },
    };

    const [invoices, agg, items] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.aggregate({ where, _sum: { totalAmount: true } }),
      this.prisma.invoiceItem.aggregate({ where: { invoice: where }, _sum: { quantity: true } }),
    ]);

    return {
      invoices,
      revenue: agg._sum.totalAmount?.toNumber() ?? 0,
      itemsSold: items._sum.quantity ?? 0,
    };
  }

  /** Best-selling products by units sold in the range (excluding cancelled). */
  async topProducts(limit: number, range?: DateRange): Promise<TopProduct[]> {
    const createdAt = this.dateFilter(range, false);
    const rows = await this.prisma.invoiceItem.groupBy({
      by: ["itemId", "itemName"],
      where: {
        itemType: "PRODUCT",
        invoice: { status: { not: "CANCELLED" }, ...(createdAt ? { createdAt } : {}) },
      },
      _sum: { quantity: true, totalAmount: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    // Pull current stock for the listed products so the dashboard can show
    // "still in stock" alongside units sold.
    const products = await this.prisma.product.findMany({
      where: { id: { in: rows.map((r) => r.itemId) } },
      select: { id: true, stockQuantity: true },
    });
    const stockById = new Map(products.map((p) => [p.id, p.stockQuantity]));

    return rows.map((r) => ({
      productId: r.itemId,
      name: r.itemName,
      quantitySold: r._sum.quantity ?? 0,
      revenue: r._sum.totalAmount?.toNumber() ?? 0,
      stockRemaining: stockById.get(r.itemId) ?? null,
    }));
  }

  /**
   * Active products at or below their minimum stock (most urgent first). Uses a
   * raw query because Prisma's `where` can't compare two columns.
   */
  async lowStock(limit: number): Promise<LowStockProduct[]> {
    const rows = await this.prisma.$queryRaw<
      { id: string; name: string; sku: string; stock_quantity: number; minimum_stock: number }[]
    >`
      SELECT id, name, sku, stock_quantity, minimum_stock
      FROM products
      WHERE deleted_at IS NULL AND status = 'ACTIVE' AND stock_quantity <= minimum_stock
      ORDER BY stock_quantity ASC, name ASC
      LIMIT ${limit}
    `;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      stockQuantity: Number(r.stock_quantity),
      minimumStock: Number(r.minimum_stock),
    }));
  }

  /**
   * The full dashboard payload in one shot — every widget's data fetched in
   * parallel. Collapses ~8 client round-trips into one request.
   */
  async overview(range?: DateRange) {
    const [
      salesSummary,
      revenueBreakdown,
      paymentsByMethod,
      passesByType,
      topPassBuyers,
      topProducts,
      recentInvoices,
      recentEnrollments,
    ] = await Promise.all([
      this.salesSummary(range),
      this.revenueBreakdown(range),
      this.paymentsByMethod(range),
      this.passesByType(range),
      this.topPassBuyers(5, range),
      this.topProducts(5, range),
      this.recentInvoices(5, range),
      this.recentEnrollments(8, range),
    ]);
    return {
      salesSummary,
      revenueBreakdown,
      paymentsByMethod,
      passesByType,
      topPassBuyers,
      topProducts,
      recentInvoices,
      recentEnrollments,
    };
  }

  async recentInvoices(limit: number, range?: DateRange): Promise<InvoiceSummaryDto[]> {
    const createdAt = this.dateFilter(range, false);
    const rows = await this.prisma.invoice.findMany({
      where: createdAt ? { createdAt } : undefined,
      include: invoiceSummaryInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toInvoiceSummaryDto);
  }
}
