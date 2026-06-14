"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconBell, IconAlertTriangle, IconPackageOff, IconChevronRight } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardService } from "@/services/dashboard-service";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

/**
 * Operational notifications. For this POS/inventory app the actionable alerts
 * are low / out-of-stock products — surfaced here so staff can restock.
 */
export function NotificationsButton() {
  const { can } = usePermissions();
  const canProducts = can("product.view");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "low-stock"],
    queryFn: () => DashboardService.lowStock(20),
    enabled: canProducts,
    refetchInterval: 60_000,
  });

  const items = data ?? [];
  const count = items.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
          <IconBell className="size-5 text-muted-foreground" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-background">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={10} className="w-80 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {canProducts && (
            <Link
              href="/notifications"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <IconChevronRight className="size-3.5" />
            </Link>
          )}
        </div>

        <div className="max-h-[20rem] overflow-y-auto p-1">
          {!canProducts ? (
            <EmptyState message="You're all caught up." />
          ) : isLoading ? (
            <div className="space-y-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2.5">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : count === 0 ? (
            <EmptyState message="No alerts — stock levels look healthy." />
          ) : (
            items.map((p) => {
              const out = p.stockQuantity <= 0;
              return (
                <div key={p.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50">
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                      out
                        ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
                    )}
                  >
                    {out ? <IconPackageOff className="size-4" /> : <IconAlertTriangle className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {out
                        ? "Out of stock — restock needed"
                        : `Low stock · ${p.stockQuantity} left (min ${p.minimumStock})`}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted">
        <IconBell className="size-5 text-muted-foreground" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
