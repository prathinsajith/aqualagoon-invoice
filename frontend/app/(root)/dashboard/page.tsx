"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconUsers,
  IconUserCheck,
  IconCoin,
  IconAlertTriangle,
  IconPackageOff,
  IconTriangle,
  IconTriangleInverted,
  IconShoppingCart,
  IconTicket,
} from "@tabler/icons-react";

import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { UserStatusBadge } from "@/components/rbac/status-badge";
import { PersonAvatar } from "@/components/person-avatar";
import {
  PaymentsReceivedCard,
  TopProductsCard,
  RecentInvoicesCard,
} from "@/components/billing/billing-widgets";
import { PassesIssuedCard, TopPassBuyersCard } from "@/components/dashboard/passes-widget";
import { SectionCard, ViewAllLink } from "@/components/dashboard/section-card";
import { AdminPage } from "@/components/rbac/admin-page";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";

import { UserService } from "@/services/user-service";
import { DashboardService } from "@/services/dashboard-service";
import { usePermissions } from "@/hooks/usePermissions";
import { useCompany } from "@/hooks/useCompany";
import { fullName, useAuthStore } from "@/stores/auth-store";
import { useGreeting } from "@/hooks/useGreeting";
import { formatMoney } from "@/lib/format";
import { rangeLabel, resolveRangeValue, type RangeValue } from "@/lib/date-range";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  valueText,
  loading,
  icon: Icon,
  tint,
  delta,
}: {
  label: string;
  value?: number | undefined;
  /** Pre-formatted display value (e.g. money); overrides `value`. */
  valueText?: string;
  loading: boolean;
  icon: typeof IconUsers;
  tint: string;
  delta?: number;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="rounded-3xl border-0 py-0 shadow-sm">
      <CardContent className="flex items-center gap-3 p-2.5">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl",
            tint,
          )}
        >
          <Icon className="size-6" stroke={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">
              {loading ? (
                <Spinner className="size-5" />
              ) : (
                (valueText ?? (value ?? 0).toLocaleString())
              )}
            </span>
            {delta !== undefined && !loading && (
              <span
                className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  up ? "text-emerald-500" : "text-rose-500",
                )}
              >
                {up ? (
                  <IconTriangle className="size-3.5" stroke={2.2} />
                ) : (
                  <IconTriangleInverted className="size-3.5" stroke={2.2} />
                )}
                {Math.abs(delta).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Combined Users card: total headline + active count as a sub-stat. */
function UsersStatCard({
  total,
  active,
  loading,
}: {
  total: number | undefined;
  active: number | undefined;
  loading: boolean;
}) {
  return (
    <Card className="rounded-3xl border-0 py-0 shadow-sm">
      <CardContent className="flex items-center gap-3 p-2.5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-400 dark:bg-sky-900/30 dark:text-sky-300">
          <IconUsers className="size-6" stroke={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">Users</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">
              {loading ? <Spinner className="size-5" /> : (total ?? 0).toLocaleString()}
            </span>
            {!loading && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                <IconUserCheck className="size-3.5" stroke={2} />
                {(active ?? 0).toLocaleString()} active
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardContent() {
  const { user } = useAuthStore();
  const greeting = useGreeting();
  const { can } = usePermissions();
  const { data: company } = useCompany();
  const companyName = company?.name || "Aqua Lagoon";

  const canUsers = can("user.view");
  const canProducts = can("product.view");
  const canBilling = can("billing.view");

  const [rangeValue, setRangeValue] = useState<RangeValue>({ preset: "today" });
  const range = useMemo(() => resolveRangeValue(rangeValue), [rangeValue]);
  const periodLabel = rangeValue.preset === "custom" ? "Custom range" : rangeLabel(rangeValue.preset);
  const isToday = rangeValue.preset === "today";

  const { data: totalUsersData, isLoading: totalUsersLoading } = useQuery({
    queryKey: ["dashboard", "users", "total"],
    queryFn: () => UserService.list({ limit: 1 }),
    enabled: canUsers,
  });
  const { data: activeUsersData, isLoading: activeUsersLoading } = useQuery({
    queryKey: ["dashboard", "users", "active"],
    queryFn: () => UserService.list({ limit: 1, status: "ACTIVE" }),
    enabled: canUsers,
  });
  const { data: recentUsersData, isLoading: recentUsersLoading } = useQuery({
    queryKey: ["dashboard", "users", "recent"],
    queryFn: () => UserService.list({ limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
    enabled: canUsers,
  });
  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ["dashboard", "low-stock"],
    queryFn: () => DashboardService.lowStock(50),
    enabled: canProducts,
  });
  const { data: salesSummaryData, isLoading: salesSummaryLoading } = useQuery({
    queryKey: ["dashboard", "sales-summary", range.from.toISOString(), range.to.toISOString()],
    queryFn: () => DashboardService.salesSummary(range),
    enabled: canBilling,
  });
  const { data: revenueBreakdownData, isLoading: revenueBreakdownLoading } = useQuery({
    queryKey: ["dashboard", "revenue-breakdown", range.from.toISOString(), range.to.toISOString()],
    queryFn: () => DashboardService.revenueBreakdown(range),
    enabled: canBilling,
  });

  const stats = [
    canBilling && {
      label: isToday ? "Today's Revenue" : "Revenue",
      valueText: formatMoney(salesSummaryData?.revenue ?? 0),
      loading: salesSummaryLoading,
      icon: IconCoin,
      tint: "bg-emerald-50 text-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    canBilling && {
      label: "Product Revenue",
      valueText: formatMoney(revenueBreakdownData?.product ?? 0),
      loading: revenueBreakdownLoading,
      icon: IconShoppingCart,
      tint: "bg-sky-50 text-sky-400 dark:bg-sky-900/30 dark:text-sky-300",
    },
    canBilling && {
      label: "Pass Revenue",
      valueText: formatMoney(revenueBreakdownData?.pass ?? 0),
      loading: revenueBreakdownLoading,
      icon: IconTicket,
      tint: "bg-violet-50 text-violet-400 dark:bg-violet-900/30 dark:text-violet-300",
    },
    canProducts && {
      label: "Low Stock",
      value: lowStockData?.length,
      loading: lowStockLoading,
      icon: IconAlertTriangle,
      tint: "bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-300",
    },
  ].filter(Boolean) as {
    label: string;
    value?: number | undefined;
    valueText?: string;
    loading: boolean;
    icon: typeof IconUsers;
    tint: string;
  }[];

  const recentUsers = recentUsersData?.data ?? [];
  const lowStock = lowStockData ?? [];
  const hasCards = canUsers || stats.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, <span className="text-primary">{fullName(user) || "there"}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening at {companyName} {isToday ? "today" : `· ${periodLabel}`}.
          </p>
        </div>
        <DateRangeFilter value={rangeValue} onChange={setRangeValue} />
      </div>

      {hasCards && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {canUsers && (
            <UsersStatCard
              total={totalUsersData?.meta.pagination.totalItems}
              active={activeUsersData?.meta.pagination.totalItems}
              loading={totalUsersLoading || activeUsersLoading}
            />
          )}
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      )}

      {/* Payments received (half) + passes issued (half) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PaymentsReceivedCard range={range} periodLabel={periodLabel} />
        <PassesIssuedCard range={range} periodLabel={periodLabel} />
      </div>

      {/* Top selling products + top pass buyers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopProductsCard range={range} />
        <TopPassBuyersCard range={range} periodLabel={periodLabel} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent users */}
        {canUsers && (
          <SectionCard
            icon={IconUsers}
            iconClassName="bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-300"
            title="Recent users"
            action={<ViewAllLink href="/users" />}
            contentClassName="space-y-1"
          >
            {recentUsersLoading ? (
              <div className="grid h-32 place-items-center">
                <Spinner className="size-6" />
              </div>
            ) : recentUsers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No users yet.</p>
            ) : (
              recentUsers.map((u) => {
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60"
                  >
                    <PersonAvatar
                      name={`${u.firstName} ${u.lastName}`}
                      photoUrl={u.photoUrl}
                      seed={u.id}
                      className="size-9"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <UserStatusBadge status={u.status} />
                  </div>
                );
              })
            )}
          </SectionCard>
        )}

        {/* Low stock alerts */}
        {canProducts && (
          <SectionCard
            icon={IconAlertTriangle}
            iconClassName="bg-rose-50 text-rose-500 dark:bg-rose-900/30 dark:text-rose-300"
            title="Low stock"
            action={<ViewAllLink href="/products" />}
            contentClassName="space-y-1"
          >
            {lowStockLoading ? (
              <div className="grid h-32 place-items-center">
                <Spinner className="size-6" />
              </div>
            ) : lowStock.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Stock levels look healthy.
              </p>
            ) : (
              lowStock.slice(0, 5).map((p) => {
                const out = p.stockQuantity <= 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        out
                          ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                          : "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
                      )}
                    >
                      {out ? (
                        <IconPackageOff className="size-4" />
                      ) : (
                        <IconAlertTriangle className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {out ? "Out of stock" : `${p.stockQuantity} left · min ${p.minimumStock}`}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </SectionCard>
        )}
      </div>

      {/* Recent invoices — full width at the bottom */}
      <RecentInvoicesCard range={range} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AdminPage>
      <DashboardContent />
    </AdminPage>
  );
}
