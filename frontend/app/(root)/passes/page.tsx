"use client";

import { useMemo, useReducer, useState } from "react";
import type { PaginationState } from "@tanstack/react-table";
import { IconSearch } from "@tabler/icons-react";

import { PageHeader } from "@/components/rbac/page-header";
import { PermissionPage } from "@/components/rbac/permission-page";
import { DataTableGeneric } from "@/components/data-table-generic";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { RefreshButton } from "@/components/refresh-button";
import { getPassColumns } from "./columns";
import { PassViewDialog } from "./pass-view-dialog";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { resolveRangeValue, type RangeValue } from "@/lib/date-range";
import { usePasses } from "@/hooks/queries/use-passes";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { PASS_KIND_LABELS, PASS_STATUS_LABELS } from "@/lib/pass-format";
import type { PassKind, UserPass, UserPassStatus } from "@/types/pass";

const STATUS_OPTIONS = Object.keys(PASS_STATUS_LABELS) as UserPassStatus[];
/** Pass-kind tabs, in display order. "all" shows every kind. */
const KIND_TABS: ("all" | PassKind)[] = ["all", "GUEST", "STUDENT", "VIP", "FAMILY", "CORPORATE"];

type ExpiryWindow = "expiring5" | "expired5" | "expired10";
/** Expiry-proximity options (relative to now) for the desk. */
const EXPIRY_OPTIONS: { value: ExpiryWindow; label: string }[] = [
  { value: "expiring5", label: "Expiring in 5 min" },
  { value: "expired5", label: "Expired ≤5 min ago" },
  { value: "expired10", label: "Expired ≤10 min ago" },
];

/** The combined filter state for the passes list. */
interface PassFilters {
  search: string;
  status: string;
  kind: "all" | PassKind;
  expiry: "all" | ExpiryWindow;
  range: RangeValue;
}

const INITIAL_FILTERS: PassFilters = {
  search: "",
  status: "all",
  kind: "all",
  // Default to today — passes taken today are the common case at the desk.
  range: { preset: "today" },
  expiry: "all",
};

export function PassesContent() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  // One reducer for all filters — a single update never fans out into separate renders.
  const [filters, patchFilters] = useReducer(
    (state: PassFilters, patch: Partial<PassFilters>) => ({ ...state, ...patch }),
    INITIAL_FILTERS,
  );
  const { search: searchInput, status: statusFilter, kind: kindFilter, expiry: expiryFilter, range: rangeValue } = filters;

  const search = useDebounce(searchInput, 400);
  const range = useMemo(() => resolveRangeValue(rangeValue), [rangeValue]);
  // Expiry-proximity search spans all dates, so the "taken on" window is dropped.
  const expiryActive = expiryFilter !== "all";

  const params = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : (statusFilter as UserPassStatus),
      type: kindFilter === "all" ? undefined : kindFilter,
      dateFrom: expiryActive ? undefined : range.from.toISOString(),
      dateTo: expiryActive ? undefined : range.to.toISOString(),
      expiryWindow: expiryActive ? (expiryFilter as ExpiryWindow) : undefined,
      sortBy: "createdAt" as const,
      sortOrder: "desc" as const,
    }),
    [pagination, search, statusFilter, kindFilter, range, expiryActive, expiryFilter],
  );

  const { data, isLoading, isError, error } = usePasses(params);

  const [viewingId, setViewingId] = useState<string | null>(null);

  const resetToFirstPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

  const columns = useMemo(
    () => getPassColumns({ onView: (p: UserPass) => setViewingId(p.id) }),
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Passes"
        description="Issued passes and memberships — track usage, renew, suspend or cancel."
      />

      <Tabs
        value={kindFilter}
        onValueChange={(v) => {
          patchFilters({ kind: v as "all" | PassKind });
          resetToFirstPage();
        }}
      >
        <TabsList className="flex-wrap">
          {KIND_TABS.map((k) => (
            <TabsTrigger key={k} value={k}>
              {k === "all" ? "All" : PASS_KIND_LABELS[k]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={searchInput}
            onChange={(e) => {
              patchFilters({ search: e.target.value });
              resetToFirstPage();
            }}
            placeholder="Search by pass number…"
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            patchFilters({ status: v });
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {PASS_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={expiryFilter}
          onValueChange={(v) => {
            patchFilters({ expiry: v as "all" | ExpiryWindow });
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Expiry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any expiry</SelectItem>
            {EXPIRY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-3 sm:ml-auto">
          <DateRangeFilter
            value={rangeValue}
            onChange={(v) => {
              patchFilters({ range: v });
              resetToFirstPage();
            }}
            disabled={expiryActive}
          />
          <RefreshButton queryKey={["passes"]} />
        </div>
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {getApiErrorMessage(error, "Failed to load passes")}
        </div>
      ) : isLoading && !data ? (
        <div className="grid min-h-[30vh] place-items-center">
          <Spinner className="size-8" />
        </div>
      ) : (
        <DataTableGeneric
          columns={columns}
          data={data?.data ?? []}
          manualPagination
          pageCount={data?.meta.pagination.totalPages ?? 0}
          totalItems={data?.meta.pagination.totalItems ?? 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          onRowClick={(p) => setViewingId(p.id)}
          showColumnVisibility={false}
        />
      )}

      <PassViewDialog
        passId={viewingId}
        open={!!viewingId}
        onOpenChange={(o) => !o && setViewingId(null)}
      />
    </div>
  );
}

export default function PassesPage() {
  return (
    <PermissionPage permission="pass.view">
      <PassesContent />
    </PermissionPage>
  );
}
