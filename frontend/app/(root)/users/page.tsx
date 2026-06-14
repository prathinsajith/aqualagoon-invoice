"use client";

import { useMemo, useReducer, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { RefreshButton } from "@/components/refresh-button";
import { getUserColumns } from "./columns";
import { UserFormDialog } from "./user-form-dialog";
import { UserViewDialog } from "./user-view-dialog";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { resolveRangeValue, type RangeValue } from "@/lib/date-range";
import { useUsers, useUserMutations } from "@/hooks/queries/use-users";
import { useRoles } from "@/hooks/queries/use-roles";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/auth-store";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { USER_STATUSES } from "@/schemas/user";
import type { ManagedUser } from "@/types/rbac";

interface UserFilters {
  search: string;
  status: string;
  role: string;
  archived: boolean;
  range: RangeValue;
}

const INITIAL_USER_FILTERS: UserFilters = {
  search: "",
  status: "all",
  role: "all",
  archived: false,
  // Joined-date window — defaults to all time so the full directory shows.
  range: { preset: "all" },
};

interface UserDialogs {
  form: boolean;
  editing: ManagedUser | null;
  viewing: ManagedUser | null;
  pending: { user: ManagedUser; type: "delete" | "restore" } | null;
}

const INITIAL_USER_DIALOGS: UserDialogs = { form: false, editing: null, viewing: null, pending: null };

export function UsersContent() {
  const { can } = usePermissions();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  // Group related state in reducers so one logical update is a single render.
  const [filters, patchFilters] = useReducer(
    (state: UserFilters, patch: Partial<UserFilters>) => ({ ...state, ...patch }),
    INITIAL_USER_FILTERS,
  );
  const [dialogs, patchDialogs] = useReducer(
    (state: UserDialogs, patch: Partial<UserDialogs>) => ({ ...state, ...patch }),
    INITIAL_USER_DIALOGS,
  );
  const { search: searchInput, status: statusFilter, role: roleFilter, archived: showArchived, range: rangeValue } = filters;
  const { form: formOpen, editing, viewing, pending: pendingAction } = dialogs;

  const search = useDebounce(searchInput, 400);
  const range = useMemo(() => resolveRangeValue(rangeValue), [rangeValue]);

  const params = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      roleId: roleFilter === "all" ? undefined : roleFilter,
      onlyDeleted: showArchived || undefined,
      createdFrom: range.from.toISOString(),
      createdTo: range.to.toISOString(),
    }),
    [pagination, search, statusFilter, roleFilter, showArchived, range],
  );

  const { data, isLoading, isError, error } = useUsers(params);
  const { data: rolesData } = useRoles({ limit: 100 });
  const { remove, restore } = useUserMutations();

  const resetToFirstPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

  const columns = useMemo(
    () =>
      getUserColumns({
        can,
        currentUserId,
        onView: (u) => patchDialogs({ viewing: u }),
        onEdit: (u) => patchDialogs({ editing: u, form: true }),
        onDelete: (u) => patchDialogs({ pending: { user: u, type: "delete" } }),
        onRestore: (u) => patchDialogs({ pending: { user: u, type: "restore" } }),
      }),
    [can, currentUserId],
  );

  const confirmAction = async () => {
    if (!pendingAction) return;
    const { user, type } = pendingAction;
    try {
      if (type === "delete") {
        await remove.mutateAsync(user.id);
        toast.success("User archived");
      } else {
        await restore.mutateAsync(user.id);
        toast.success("User restored");
      }
      patchDialogs({ pending: null });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage user accounts, roles and access.">
        <Can permission="user.create">
          <Button
            onClick={() => patchDialogs({ editing: null, form: true })}
          >
            <IconPlus className="size-4" /> New user
          </Button>
        </Can>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={searchInput}
            onChange={(e) => {
              patchFilters({ search: e.target.value });
              resetToFirstPage();
            }}
            placeholder="Search name, email, code…"
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
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {USER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={roleFilter}
          onValueChange={(v) => {
            patchFilters({ role: v });
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {(rolesData?.data ?? []).map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label htmlFor="show-archived" className="flex items-center gap-2 text-sm">
          <Checkbox
            id="show-archived"
            checked={showArchived}
            onCheckedChange={(v) => {
              patchFilters({ archived: !!v });
              resetToFirstPage();
            }}
          />
          Show archived
        </label>

        <div className="flex items-center gap-3 sm:ml-auto">
          <DateRangeFilter
            value={rangeValue}
            onChange={(v) => {
              patchFilters({ range: v });
              resetToFirstPage();
            }}
          />
          <RefreshButton queryKey={["users"]} />
        </div>
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {getApiErrorMessage(error, "Failed to load users")}
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
          onRowClick={(u) => patchDialogs({ viewing: u })}
          showColumnVisibility={false}
        />
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={(o) => patchDialogs({ form: o })}
        user={editing}
      />
      <UserViewDialog
        user={viewing}
        open={!!viewing}
        onOpenChange={(o) => !o && patchDialogs({ viewing: null })}
      />
      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={(o) => !o && patchDialogs({ pending: null })}
        title={pendingAction?.type === "delete" ? "Archive user?" : "Restore user?"}
        description={
          pendingAction?.type === "delete"
            ? "The user will be soft-deleted and can be restored later."
            : "The user will be reactivated and able to sign in again."
        }
        confirmLabel={pendingAction?.type === "delete" ? "Archive" : "Restore"}
        destructive={pendingAction?.type === "delete"}
        loading={remove.isPending || restore.isPending}
        onConfirm={confirmAction}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <PermissionPage permission="user.view">
      <UsersContent />
    </PermissionPage>
  );
}
