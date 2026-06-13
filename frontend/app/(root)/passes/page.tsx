"use client";

import { useMemo, useState } from "react";
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

import { getPassColumns } from "./columns";
import { PassViewDialog } from "./pass-view-dialog";
import { usePasses } from "@/hooks/queries/use-passes";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { PASS_STATUS_LABELS } from "@/lib/pass-format";
import type { UserPass, UserPassStatus } from "@/types/pass";

const STATUS_OPTIONS = Object.keys(PASS_STATUS_LABELS) as UserPassStatus[];

export function PassesContent() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const search = useDebounce(searchInput, 400);

  const params = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : (statusFilter as UserPassStatus),
      sortBy: "createdAt" as const,
      sortOrder: "desc" as const,
    }),
    [pagination, search, statusFilter],
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

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              resetToFirstPage();
            }}
            placeholder="Search by pass number…"
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
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
