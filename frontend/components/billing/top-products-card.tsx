"use client";

import { useQuery } from "@tanstack/react-query";
import { IconTrophy } from "@tabler/icons-react";

import { WidgetRowsSkeleton } from "@/components/skeletons";
import { SectionCard } from "@/components/dashboard/section-card";
import { DashboardService } from "@/services/dashboard-service";
import { usePermissions } from "@/hooks/usePermissions";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { rangeKey } from "./dashboard-card-utils";
import type { DateRange } from "@/lib/date-range";
import type { TopProduct } from "@/types/billing";

/** Best-selling products in the range. */
export function TopProductsCard({
  range,
  data,
  loading,
}: {
  range: DateRange;
  data?: TopProduct[];
  loading?: boolean;
}) {
  const { can } = usePermissions();
  const enabled = can("billing.view");
  const controlled = data !== undefined;

  const { data: topData, isLoading: topLoading } = useQuery({
    queryKey: ["dashboard", "top-products", ...rangeKey(range)],
    queryFn: () => DashboardService.topProducts(5, range),
    enabled: enabled && !controlled,
  });

  if (!enabled) return null;

  const top = data ?? topData ?? [];
  const isLoadingTop = controlled ? !!loading : topLoading;

  return (
    <SectionCard
      icon={IconTrophy}
      iconClassName="bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-300"
      title="Top selling products"
      contentClassName="divide-y divide-foreground/10"
    >
      {isLoadingTop ? (
        <WidgetRowsSkeleton />
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
    </SectionCard>
  );
}
