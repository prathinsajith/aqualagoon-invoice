"use client";

import { useQuery } from "@tanstack/react-query";
import { IconTrophy } from "@tabler/icons-react";

import { Spinner } from "@/components/ui/spinner";
import { SectionCard } from "@/components/dashboard/section-card";
import { DashboardService } from "@/services/dashboard-service";
import { usePermissions } from "@/hooks/usePermissions";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { rangeKey } from "./dashboard-card-utils";
import type { DateRange } from "@/lib/date-range";

/** Best-selling products in the range. */
export function TopProductsCard({ range }: { range: DateRange }) {
  const { can } = usePermissions();
  const enabled = can("billing.view");

  const { data: topData, isLoading: topLoading } = useQuery({
    queryKey: ["dashboard", "top-products", ...rangeKey(range)],
    queryFn: () => DashboardService.topProducts(5, range),
    enabled,
  });

  if (!enabled) return null;

  const top = topData ?? [];

  return (
    <SectionCard
      icon={IconTrophy}
      iconClassName="bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-300"
      title="Top selling products"
      contentClassName="space-y-1"
    >
      {topLoading ? (
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
    </SectionCard>
  );
}
