"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  IconBell,
  IconAlertTriangle,
  IconPackageOff,
  IconChevronRight,
} from "@tabler/icons-react";

import { Card, CardContent } from "@/components/ui/card";
import { RefreshButton } from "@/components/refresh-button";
import { TableSkeleton } from "@/components/skeletons";
import { DashboardService } from "@/services/dashboard-service";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

/**
 * Notifications listing. For this POS/inventory app the actionable alerts are
 * low / out-of-stock products; this is the full-page view behind the header
 * bell's "View all".
 */
export default function NotificationsPage() {
  const { can } = usePermissions();
  const canProducts = can("product.view");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications", "low-stock", "page"],
    queryFn: () => DashboardService.lowStock(50),
    enabled: canProducts,
    refetchInterval: 60_000,
  });

  const items = data ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <IconBell className="size-5 text-primary" /> Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Stock alerts that need attention. Updated automatically.
          </p>
        </div>
        {canProducts && <RefreshButton queryKey={["notifications"]} />}
      </div>

      {!canProducts ? (
        <EmptyState message="You're all caught up." />
      ) : isError ? (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="py-10 text-center text-sm text-destructive">
            Couldn&apos;t load notifications. Please try again.
          </CardContent>
        </Card>
      ) : isLoading && !data ? (
        <TableSkeleton cols={2} rows={6} />
      ) : items.length === 0 ? (
        <EmptyState message="No alerts — stock levels look healthy." />
      ) : (
        <Card className="overflow-hidden rounded-2xl border-0 shadow-sm">
          <CardContent className="divide-y divide-foreground/10 p-0">
            {items.map((p) => {
              const out = p.stockQuantity <= 0;
              return (
                <Link
                  key={p.id}
                  href="/products"
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      out
                        ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
                    )}
                  >
                    {out ? <IconPackageOff className="size-5" /> : <IconAlertTriangle className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {out
                        ? "Out of stock — restock needed"
                        : `Low stock · ${p.stockQuantity} left (min ${p.minimumStock})`}
                      {p.sku ? ` · ${p.sku}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      out
                        ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
                    )}
                  >
                    {out ? "Out of stock" : "Low"}
                  </span>
                  <IconChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <IconBell className="size-6" />
        </span>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
