"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconReceipt2 } from "@tabler/icons-react";

import { WidgetRowsSkeleton } from "@/components/skeletons";
import { InvoiceStatusBadge } from "@/components/billing/invoice-status-badge";
import { SectionCard, ViewAllLink } from "@/components/dashboard/section-card";
import { DashboardService } from "@/services/dashboard-service";
import { usePermissions } from "@/hooks/usePermissions";
import { formatMoney } from "@/lib/format";
import { rangeKey } from "./dashboard-card-utils";
import type { DateRange } from "@/lib/date-range";
import type { InvoiceSummary } from "@/types/billing";

/** Most recent invoices in the range. */
export function RecentInvoicesCard({
  range,
  data,
  loading,
}: {
  range: DateRange;
  data?: InvoiceSummary[];
  loading?: boolean;
}) {
  const { can } = usePermissions();
  const enabled = can("billing.view");
  const controlled = data !== undefined;

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ["dashboard", "recent-invoices", ...rangeKey(range)],
    queryFn: () => DashboardService.recentInvoices(5, range),
    enabled: enabled && !controlled,
  });

  if (!enabled) return null;

  const recent = data ?? recentData ?? [];
  const isLoadingRecent = controlled ? !!loading : recentLoading;

  return (
    <SectionCard
      icon={IconReceipt2}
      iconClassName="bg-violet-50 text-violet-500 dark:bg-violet-900/30 dark:text-violet-300"
      title="Recent invoices"
      action={<ViewAllLink href="/invoices" />}
      contentClassName="divide-y divide-foreground/10"
    >
      {isLoadingRecent ? (
        <WidgetRowsSkeleton />
      ) : recent.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No invoices in this period.</p>
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
    </SectionCard>
  );
}
