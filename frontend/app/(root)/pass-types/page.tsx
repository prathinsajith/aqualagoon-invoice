"use client";

import { useMemo, useState } from "react";
import type { PaginationState } from "@tanstack/react-table";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/rbac/page-header";
import { PermissionPage } from "@/components/rbac/permission-page";
import { ConfirmDialog } from "@/components/rbac/confirm-dialog";
import { Can } from "@/components/permission-gate";
import { DataTableGeneric } from "@/components/data-table-generic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { RefreshButton } from "@/components/refresh-button";
import { getPassTypeColumns } from "./columns";
import { PassTypeFormDialog } from "./pass-type-form-dialog";
import { PassTypeViewDialog } from "./pass-type-view-dialog";
import { usePassTypes, usePassTypeMutations } from "@/hooks/queries/use-pass-types";
import { usePermissions } from "@/hooks/usePermissions";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { PASS_KIND_LABELS } from "@/lib/pass-format";
import type { PassKind, PassType } from "@/types/pass";
import type { ProductStatus } from "@/types/product";

const KIND_OPTIONS = Object.keys(PASS_KIND_LABELS) as PassKind[];

export function PassTypesContent() {
  const { can } = usePermissions();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const search = useDebounce(searchInput, 400);

  const params = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : (statusFilter as ProductStatus),
      type: typeFilter === "all" ? undefined : (typeFilter as PassKind),
    }),
    [pagination, search, statusFilter, typeFilter],
  );

  const { data, isLoading, isError, error } = usePassTypes(params);
  const { remove } = usePassTypeMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PassType | null>(null);
  const [viewing, setViewing] = useState<PassType | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PassType | null>(null);

  const resetToFirstPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

  const columns = useMemo(
    () =>
      getPassTypeColumns({
        can,
        onView: setViewing,
        onEdit: (pt) => {
          setEditing(pt);
          setFormOpen(true);
        },
        onDelete: (pt) => setPendingDelete(pt),
      }),
    [can],
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await remove.mutateAsync(pendingDelete.id);
      toast.success("Pass type deleted");
      setPendingDelete(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pass Types"
        description="Sellable passes — guest entries, student memberships, VIP packages."
      >
        <Can permission="pass_type.create">
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <IconPlus className="size-4" /> New pass type
          </Button>
        </Can>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              resetToFirstPage();
            }}
            placeholder="Search by name…"
            className="pl-9"
          />
        </div>

        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {KIND_OPTIONS.map((k) => (
              <SelectItem key={k} value={k}>
                {PASS_KIND_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <RefreshButton queryKey={["pass-types"]} className="sm:ml-auto" />
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {getApiErrorMessage(error, "Failed to load pass types")}
        </div>
      ) : (
        <DataTableGeneric
          loading={isLoading && !data}
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

      <PassTypeFormDialog open={formOpen} onOpenChange={setFormOpen} passType={editing} />
      <PassTypeViewDialog
        passType={viewing}
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Delete pass type?"
        description="The pass type will be archived. Types with issued passes can't be deleted."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default function PassTypesPage() {
  return (
    <PermissionPage permission="pass_type.view">
      <PassTypesContent />
    </PermissionPage>
  );
}
