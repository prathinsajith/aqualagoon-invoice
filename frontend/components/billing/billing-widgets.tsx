"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconReceipt2, IconTrophy, IconWallet } from "@tabler/icons-react";

import { Spinner } from "@/components/ui/spinner";
import { InvoiceStatusBadge } from "@/components/billing/invoice-status-badge";
import { SectionCard, ViewAllLink } from "@/components/dashboard/section-card";
import { DashboardService } from "@/services/dashboard-service";
import { usePermissions } from "@/hooks/usePermissions";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DateRange } from "@/lib/date-range";

export function BillingWidgets({
  range,
  periodLabel,
}: {
  range: DateRange;
  periodLabel: string;
}) {
  const { can } = usePermissions();
  const enabled = can("billing.view");
  const key = [range.from.toISOString(), range.to.toISOString()];

  const topQ = useQuery({
    queryKey: ["dashboard", "top-products", ...key],
    queryFn: () => DashboardService.topProducts(5, range),
    enabled,
  });
  const recentQ = useQuery({
    queryKey: ["dashboard", "recent-invoices", ...key],
    queryFn: () => DashboardService.recentInvoices(5, range),
    enabled,
  });
  const paymentsQ = useQuery({
    queryKey: ["dashboard", "payments-by-method", ...key],
    queryFn: () => DashboardService.paymentsByMethod(range),
    enabled,
  });

  if (!enabled) return null;

  const top = topQ.data ?? [];
  const recent = recentQ.data ?? [];
  const payments = paymentsQ.data ?? [];
  const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const caption = periodLabel.toLowerCase();

  return (
    <div className="space-y-6">
      {/* Amount received by payment method */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <IconWallet className="size-5" stroke={1.6} />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-base">Payments received</CardTitle>
            <p className="truncate text-xs text-muted-foreground">{caption} · by method</p>
          </div>
        </CardHeader>
        <CardContent>
          {paymentsQ.isLoading ? (
            <div className="grid h-24 place-items-center">
              <Spinner className="size-6" />
            </div>
          ) : payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No payments received in this period.
            </p>
          ) : (
            <>
              <div className="divide-y">
                {payments.map((p) => (
                  <div
                    key={p.paymentMethodId}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatMoney(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-1 flex items-center justify-between border-t pt-3">
                <span className="text-sm font-semibold">Total received</span>
                <span className="text-lg font-bold tabular-nums">{formatMoney(paymentsTotal)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top selling products */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Top selling products</CardTitle>
            <IconTrophy className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            {topQ.isLoading ? (
              <div className="grid h-32 place-items-center">
                <Spinner className="size-6" />
              </div>
            ) : top.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No sales in this period.</p>
            ) : (
              top.map((p, i) => (
                <div
                  key={p.productId}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.quantitySold} sold
                      {p.stockRemaining !== null && (
                        <>
                          {" · "}
                          <span className={cn(p.stockRemaining <= 0 && "text-destructive")}>
                            {p.stockRemaining} in stock
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatMoney(p.revenue)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent invoices */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent invoices</CardTitle>
            <Link
              href="/invoices"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <IconChevronRight className="size-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentQ.isLoading ? (
              <div className="grid h-32 place-items-center">
                <Spinner className="size-6" />
              </div>
            ) : recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No invoices in this period.
              </p>
            ) : (
              recent.map((inv) => (
                <Link
                  key={inv.id}
                  href="/invoices"
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm font-medium">{inv.invoiceNo}</p>
                    <p className="text-xs text-muted-foreground">{inv.itemCount} items</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatMoney(inv.totalAmount)}
                  </span>
                  <InvoiceStatusBadge status={inv.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
