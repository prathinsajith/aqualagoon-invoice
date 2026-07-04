import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Shared, content-shaped loading skeletons. Used by route `loading.tsx` files
 * (shown during navigation) and in-page while a query is fetching, so the
 * layout is stable and the wait reads as "almost there" rather than a spinner.
 */

/** Page title + subtitle + a primary action button. */
export function PageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-64" />
      </div>
      {withAction && <Skeleton className="h-9 w-32 rounded-lg" />}
    </div>
  );
}

/** Search field + a couple of filter controls. */
export function FilterBarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Skeleton className="h-9 w-full max-w-md rounded-md" />
      <Skeleton className="h-9 w-28 rounded-md sm:ml-auto" />
      <Skeleton className="h-9 w-9 rounded-md" />
    </div>
  );
}

/** A table card with a header row and shimmer body rows. */
export function TableSkeleton({
  rows = 8,
  cols = 5,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn("table-container metronic-card overflow-hidden", className)}>
      {/* Header */}
      <div
        className="grid items-center gap-4 border-b border-border px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid items-center gap-4 px-4 py-3"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn("h-4", c === 0 ? "w-32" : "w-20", c === cols - 1 && "w-12 justify-self-end")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Header + filter bar + table — the standard list page shape. */
export function ListPageSkeleton({ cols = 5, rows = 8 }: { cols?: number; rows?: number }) {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton />
      <FilterBarSkeleton />
      <TableSkeleton cols={cols} rows={rows} />
    </div>
  );
}

/** A simple card block with a title and a few lines (for detail/settings pages). */
export function CardSkeleton({ lines = 4, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("rounded-2xl border-0 bg-card p-5 shadow-sm", className)}>
      <Skeleton className="mb-4 h-5 w-40" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-1/2" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

/** Header + a stack of card blocks — for detail/settings/form pages. */
export function DetailPageSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton withAction={false} />
      <div className="grid gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton key={i} lines={i === 0 ? 5 : 3} />
        ))}
      </div>
    </div>
  );
}

/** Rows of "label … value" — for dashboard widget card bodies. */
export function WidgetRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-foreground/10">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-2.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/** The dashboard: hero, KPI tiles, widget cards, and list panels. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-sm">
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        ))}
      </div>
      {/* Widget cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={4} />
      </div>
      {/* List panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={5} />
      </div>
    </div>
  );
}
