"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  IconUsers,
  IconUserCheck,
  IconCoin,
  IconSchool,
  IconShoppingCart,
  IconTicket,
  IconCalendarEvent,
  IconBarbell,
  IconArrowRight,
} from "@tabler/icons-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { RefreshButton } from "@/components/refresh-button";

import { UserService } from "@/services/user-service";
import { DashboardService } from "@/services/dashboard-service";
import { BatchService, EnrollmentService } from "@/services/training-service";
import { usePermissions } from "@/hooks/usePermissions";
import { useCompany } from "@/hooks/useCompany";
import { fullName, useAuthStore } from "@/stores/auth-store";
import { useGreeting } from "@/hooks/useGreeting";
import { formatMoney } from "@/lib/format";
import { rangeLabel, resolveRangeValue, type RangeValue } from "@/lib/date-range";
import { cn } from "@/lib/utils";
import type { ManagedUser } from "@/types/rbac";
import type { TrainingBatch } from "@/types/training";
import type { RecentEnrollment } from "@/types/billing";

/** A single KPI tile. One consistent design for every metric on the dashboard. */
function StatCard({
  label,
  value,
  valueText,
  badge,
  loading,
  icon: Icon,
  tint,
}: {
  label: string;
  value?: number;
  /** Pre-formatted display value (e.g. money); overrides `value`. */
  valueText?: string;
  /** Optional sub-stat shown as a small pill (e.g. "12 active"). */
  badge?: { icon: typeof IconUsers; text: string } | null;
  loading: boolean;
  icon: typeof IconUsers;
  tint: string;
}) {
  return (
    <Card className="rounded-2xl border-0 py-0 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-3 p-3.5">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tint)}>
          <Icon className="size-[22px]" stroke={1.6} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                (valueText ?? (value ?? 0).toLocaleString())
              )}
            </span>
            {badge && !loading && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                <badge.icon className="size-3.5" stroke={2} />
                {badge.text}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatItem {
  label: string;
  value?: number;
  valueText?: string;
  badge?: { icon: typeof IconUsers; text: string } | null;
  loading: boolean;
  icon: typeof IconUsers;
  tint: string;
}

/** Recent users list card. */
function RecentUsersSection({ users, loading }: { users: ManagedUser[]; loading: boolean }) {
  return (
    <SectionCard
      icon={IconUsers}
      iconClassName="bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-300"
      title="Recent users"
      action={<ViewAllLink href="/users" />}
      contentClassName="divide-y divide-foreground/10"
    >
      {loading ? (
        <div className="space-y-1 py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      ) :users.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No users yet.</p>
      ) : (
        users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60">
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
        ))
      )}
    </SectionCard>
  );
}

/** Active batches list card (trainer/staff view). */
function ActiveBatchesSection({ batches, loading }: { batches: TrainingBatch[]; loading: boolean }) {
  return (
    <SectionCard
      icon={IconCalendarEvent}
      iconClassName="bg-violet-50 text-violet-500 dark:bg-violet-900/30 dark:text-violet-300"
      title="Active batches"
      action={<ViewAllLink href="/students" />}
      contentClassName="divide-y divide-foreground/10"
    >
      {loading ? (
        <div className="space-y-1 py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      ) :batches.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No active batches.</p>
      ) : (
        batches.map((b) => {
          const pct = b.capacity > 0 ? Math.min(100, Math.round((b.currentStrength / b.capacity) * 100)) : 0;
          return (
            <div key={b.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{b.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {b.program.name}
                  {b.trainerName ? ` · ${b.trainerName}` : ""}
                  {b.startTime ? ` · ${b.startTime}${b.endTime ? `–${b.endTime}` : ""}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {b.currentStrength}/{b.capacity || "∞"}
                </span>
                {b.capacity > 0 && (
                  <span className="block h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        pct >= 100 ? "bg-rose-500" : "bg-violet-500",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </SectionCard>
  );
}

/** New admissions list card — links each row to the fee ledger. */
function NewAdmissionsSection({
  admissions,
  loading,
  isToday,
}: {
  admissions: RecentEnrollment[];
  loading: boolean;
  isToday: boolean;
}) {
  return (
    <SectionCard
      icon={IconSchool}
      iconClassName="bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300"
      title={isToday ? "New admissions today" : "New admissions"}
      action={<ViewAllLink href="/student-fees" />}
      contentClassName="space-y-1"
    >
      {loading ? (
        <div className="space-y-1 py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      ) :admissions.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No admissions {isToday ? "today" : "in this period"} yet.
        </p>
      ) : (
        admissions.map((e) => (
          <Link
            key={e.id}
            href="/student-fees"
            className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60"
          >
            <PersonAvatar
              name={e.studentName}
              photoUrl={e.studentPhotoUrl}
              seed={e.studentId}
              className="size-9"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{e.studentName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {e.programName} · {e.batchName}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatMoney(e.paid)}
              </span>
              {e.balance > 0 ? (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {formatMoney(e.balance)} due
                </span>
              ) : (
                <span className="text-[11px] font-medium text-muted-foreground">
                  {e.billed > 0 ? "Fully paid" : "No fee"}
                </span>
              )}
            </div>
          </Link>
        ))
      )}
    </SectionCard>
  );
}

function DashboardContent() {
  const { user } = useAuthStore();
  const greeting = useGreeting();
  const { can } = usePermissions();
  const { data: company } = useCompany();
  const companyName = company?.name || "Aqua Lagoon";

  const canUsers = can("user.view");
  const canBilling = can("billing.view");
  const canEnrollments = can("enrollment.view");
  const canBatches = can("batch.view");
  // Users without billing access (e.g. trainers) get a training-focused view.
  const showTraining = !canBilling && (canBatches || canEnrollments);

  const [rangeValue, setRangeValue] = useState<RangeValue>({ preset: "today" });
  const range = useMemo(() => resolveRangeValue(rangeValue), [rangeValue]);
  const periodLabel = rangeValue.preset === "custom" ? "Custom range" : rangeLabel(rangeValue.preset);
  const isToday = rangeValue.preset === "today";

  // --- Data ---------------------------------------------------------------
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
  const { data: recentAdmissionsData, isLoading: recentAdmissionsLoading } = useQuery({
    queryKey: ["dashboard", "recent-enrollments", range.from.toISOString(), range.to.toISOString()],
    queryFn: () => DashboardService.recentEnrollments(8, range),
    enabled: canEnrollments,
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
  // Training KPIs (only fetched for the non-billing / trainer view).
  const { data: activeBatchesData, isLoading: activeBatchesLoading } = useQuery({
    queryKey: ["dashboard", "batches", "active"],
    queryFn: () => BatchService.list({ page: 1, limit: 6, status: "ACTIVE", sortBy: "name", sortOrder: "asc" }),
    enabled: showTraining && canBatches,
  });
  const { data: activeStudentsData, isLoading: activeStudentsLoading } = useQuery({
    queryKey: ["dashboard", "enrollments", "active-count"],
    queryFn: () => EnrollmentService.list({ page: 1, limit: 1, status: "ACTIVE" }),
    enabled: showTraining && canEnrollments,
  });

  // --- KPI tiles (role-aware) --------------------------------------------
  const stats: StatItem[] = [];
  if (canUsers) {
    stats.push({
      label: "Users",
      value: totalUsersData?.meta.pagination.totalItems,
      badge: { icon: IconUserCheck, text: `${(activeUsersData?.meta.pagination.totalItems ?? 0).toLocaleString()} active` },
      loading: totalUsersLoading || activeUsersLoading,
      icon: IconUsers,
      tint: "bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-300",
    });
  }
  if (canBilling) {
    stats.push(
      {
        label: isToday ? "Today's revenue" : "Revenue",
        valueText: formatMoney(salesSummaryData?.revenue ?? 0),
        loading: salesSummaryLoading,
        icon: IconCoin,
        tint: "bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300",
      },
      {
        label: "Product revenue",
        valueText: formatMoney(revenueBreakdownData?.product ?? 0),
        loading: revenueBreakdownLoading,
        icon: IconShoppingCart,
        tint: "bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300",
      },
      {
        label: "Pass revenue",
        valueText: formatMoney(revenueBreakdownData?.pass ?? 0),
        loading: revenueBreakdownLoading,
        icon: IconTicket,
        tint: "bg-violet-50 text-violet-500 dark:bg-violet-900/30 dark:text-violet-300",
      },
      {
        label: "Admissions revenue",
        valueText: formatMoney(revenueBreakdownData?.training ?? 0),
        loading: revenueBreakdownLoading,
        icon: IconSchool,
        tint: "bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-300",
      },
    );
  }
  if (showTraining && canBatches) {
    stats.push({
      label: "Active batches",
      value: activeBatchesData?.meta.pagination.totalItems,
      loading: activeBatchesLoading,
      icon: IconCalendarEvent,
      tint: "bg-violet-50 text-violet-500 dark:bg-violet-900/30 dark:text-violet-300",
    });
  }
  if (showTraining && canEnrollments) {
    stats.push({
      label: "Active students",
      value: activeStudentsData?.meta.pagination.totalItems,
      loading: activeStudentsLoading,
      icon: IconBarbell,
      tint: "bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300",
    });
  }

  const recentUsers = recentUsersData?.data ?? [];
  const recentAdmissions = recentAdmissionsData ?? [];
  const activeBatches = activeBatchesData?.data ?? [];

  // Bottom "list" panels, chosen by role so the row is never lopsided.
  const showRecentUsers = canUsers;
  const showActiveBatches = showTraining && canBatches;
  const showAdmissions = canEnrollments;
  const listPanelCount = [showRecentUsers, showActiveBatches, showAdmissions].filter(Boolean).length;

  const nothingToShow = stats.length === 0 && !canBilling && listPanelCount === 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="overflow-hidden rounded-xl border border-border bg-gradient-to-r from-primary/15 via-card to-card shadow-md dark:from-primary/25 dark:via-primary/5 dark:to-card">
        <CardContent className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight">
              {greeting}, <span className="text-primary">{fullName(user) || "there"}</span>
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              Here&apos;s what&apos;s happening at {companyName}{" "}
              {isToday ? "today" : `· ${periodLabel}`}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangeFilter value={rangeValue} onChange={setRangeValue} />
            <RefreshButton queryKey={["dashboard"]} />
          </div>
        </CardContent>
      </Card>

      {/* KPI tiles */}
      {stats.length > 0 && (
        <div
          className={cn(
            "grid gap-4",
            stats.length <= 2
              ? "grid-cols-1 sm:grid-cols-2"
              : stats.length === 3
                ? "grid-cols-2 lg:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
          )}
        >
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      )}

      {/* Billing widgets */}
      {canBilling && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PaymentsReceivedCard range={range} periodLabel={periodLabel} />
            <PassesIssuedCard range={range} periodLabel={periodLabel} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopProductsCard range={range} />
            <TopPassBuyersCard range={range} periodLabel={periodLabel} />
          </div>
        </>
      )}

      {/* List panels (recent users / active batches / new admissions) */}
      {listPanelCount > 0 && (
        <div
          className={cn(
            "grid grid-cols-1 gap-6",
            listPanelCount > 1 && "lg:grid-cols-2",
          )}
        >
          {showRecentUsers && (
            <RecentUsersSection users={recentUsers} loading={recentUsersLoading} />
          )}
          {showActiveBatches && (
            <ActiveBatchesSection batches={activeBatches} loading={activeBatchesLoading} />
          )}
          {showAdmissions && (
            <NewAdmissionsSection
              admissions={recentAdmissions}
              loading={recentAdmissionsLoading}
              isToday={isToday}
            />
          )}
        </div>
      )}

      {/* Recent invoices — full width at the bottom (billing only) */}
      {canBilling && <RecentInvoicesCard range={range} />}

      {/* Fallback for users with no dashboard-relevant access */}
      {nothingToShow && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <IconArrowRight className="size-6" />
            </span>
            <p className="text-base font-semibold">Welcome to {companyName}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              You&apos;re all set. Use the sidebar to get to your work — your dashboard widgets will
              appear here as you&apos;re granted access.
            </p>
          </CardContent>
        </Card>
      )}
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
