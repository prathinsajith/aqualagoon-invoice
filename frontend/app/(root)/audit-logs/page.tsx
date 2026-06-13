"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
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

import { useAuditLogs } from "@/hooks/queries/use-audit-logs";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { DateText } from "@/components/date-text";
import { AuditLogDetailDialog } from "./audit-log-detail-dialog";
import { humanizeAction } from "./audit-utils";
import type { AuditLog } from "@/types/rbac";

const MODULES = [
  "auth",
  "users",
  "roles",
  "permissions",
  "profile",
  "company",
  "products",
  "product-categories",
];

const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: "createdAt",
    header: "When",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm">
        <DateText value={row.original.createdAt} withTime />
      </span>
    ),
  },
  {
    id: "user",
    header: "Actor",
    cell: ({ row }) => {
      const u = row.original.user;
      return u ? (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {u.firstName} {u.lastName}
          </span>
          <span className="text-xs text-muted-foreground">{u.email}</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">System / anonymous</span>
      );
    },
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <span className="text-sm font-medium">{humanizeAction(row.original.action)}</span>
    ),
  },
  {
    accessorKey: "module",
    header: "Module",
    cell: ({ row }) => <span className="text-sm capitalize">{row.original.module}</span>,
  },
  {
    accessorKey: "ipAddress",
    header: "IP",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.ipAddress || "—"}
      </span>
    ),
  },
];

function AuditLogsContent() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [searchInput, setSearchInput] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [viewing, setViewing] = useState<AuditLog | null>(null);
  const search = useDebounce(searchInput, 400);

  const params = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: search || undefined,
      module: moduleFilter === "all" ? undefined : moduleFilter,
    }),
    [pagination, search, moduleFilter],
  );

  const { data, isLoading, isError, error } = useAuditLogs(params);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="A record of security-relevant actions." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            placeholder="Search action or module…"
            className="pl-9"
          />
        </div>
        <Select
          value={moduleFilter}
          onValueChange={(v) => {
            setModuleFilter(v);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modules</SelectItem>
            {MODULES.map((m) => (
              <SelectItem key={m} value={m} className="capitalize">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {getApiErrorMessage(error, "Failed to load audit logs")}
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
          onRowClick={setViewing}
          showColumnVisibility={false}
        />
      )}

      <AuditLogDetailDialog
        log={viewing}
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
      />
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <PermissionPage permission="audit.view">
      <AuditLogsContent />
    </PermissionPage>
  );
}
