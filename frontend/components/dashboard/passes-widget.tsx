"use client";

import { useQuery } from "@tanstack/react-query";
import { IconTicket, IconTrophy } from "@tabler/icons-react";

import { Spinner } from "@/components/ui/spinner";
import { SectionCard, ViewAllLink } from "@/components/dashboard/section-card";
import { PersonAvatar } from "@/components/person-avatar";
import { DashboardService } from "@/services/dashboard-service";
import { usePermissions } from "@/hooks/usePermissions";
import { formatMoney } from "@/lib/format";
import type { DateRange } from "@/lib/date-range";

const rangeKey = (range: DateRange) => [range.from.toISOString(), range.to.toISOString()];

/** Passes issued in the range, grouped by pass type. */
export function PassesIssuedCard({
  range,
  periodLabel,
}: {
  range: DateRange;
  periodLabel: string;
}) {
  const { can } = usePermissions();
  const enabled = can("pass.view");

  const { data: passesData, isLoading: passesLoading } = useQuery({
    queryKey: ["dashboard", "passes-by-type", ...rangeKey(range)],
    queryFn: () => DashboardService.passesByType(range),
    enabled,
  });

  if (!enabled) return null;

  const passes = passesData ?? [];
  const totalCount = passes.reduce((sum, p) => sum + p.count, 0);
  const totalRevenue = passes.reduce((sum, p) => sum + p.revenue, 0);

  return (
    <SectionCard
      icon={IconTicket}
      iconClassName="bg-teal-50 text-teal-500 dark:bg-teal-900/30 dark:text-teal-300"
      title="Passes issued"
      caption={`${periodLabel.toLowerCase()} · by type`}
      action={<ViewAllLink href="/passes" />}
    >
      {passesLoading ? (
        <div className="grid h-24 place-items-center">
          <Spinner className="size-6" />
        </div>
      ) : passes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No passes issued in this period.
        </p>
      ) : (
        <>
          <div className="divide-y">
            {passes.map((p) => (
              <div key={p.passTypeId} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium">{p.name}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                    {p.count}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatMoney(p.revenue)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-3">
            <span className="text-sm font-semibold">
              Total · {totalCount} {totalCount === 1 ? "pass" : "passes"}
            </span>
            <span className="text-lg font-bold tabular-nums">{formatMoney(totalRevenue)}</span>
          </div>
        </>
      )}
    </SectionCard>
  );
}

/** Top pass buyers in the range. */
export function TopPassBuyersCard({
  range,
  periodLabel,
}: {
  range: DateRange;
  periodLabel: string;
}) {
  const { can } = usePermissions();
  const enabled = can("pass.view");

  const { data: buyersData, isLoading: buyersLoading } = useQuery({
    queryKey: ["dashboard", "top-pass-buyers", ...rangeKey(range)],
    queryFn: () => DashboardService.topPassBuyers(5, range),
    enabled,
  });

  if (!enabled) return null;

  const buyers = buyersData ?? [];

  return (
    <SectionCard
      icon={IconTrophy}
      iconClassName="bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-300"
      title="Top pass buyers"
      caption={`${periodLabel.toLowerCase()} · top 5`}
      contentClassName="space-y-1"
    >
      {buyersLoading ? (
        <div className="grid h-24 place-items-center">
          <Spinner className="size-6" />
        </div>
      ) : buyers.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No pass buyers in this period.
        </p>
      ) : (
        buyers.map((b, i) => {
          return (
            <div
              key={b.userId ?? `walkin-${i}`}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60"
            >
              <span className="w-4 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <PersonAvatar
                name={b.name}
                photoUrl={b.photoUrl}
                seed={b.userId ?? b.name}
                className="size-9"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{b.name}</p>
                <p className="text-xs text-muted-foreground">
                  {b.passCount} {b.passCount === 1 ? "pass" : "passes"}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{formatMoney(b.totalSpent)}</span>
            </div>
          );
        })
      )}
    </SectionCard>
  );
}
