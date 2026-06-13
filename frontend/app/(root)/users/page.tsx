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
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getUserColumns } from "./columns";
import { UserFormDialog } from "./user-form-dialog";
import { UserViewDialog } from "./user-view-dialog";
import { useUsers, useUserMutations } from "@/hooks/queries/use-users";
import { useRoles } from "@/hooks/queries/use-roles";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/auth-store";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { USER_STATUSES } from "@/schemas/user";
import type { ManagedUser } from "@/types/rbac";

function UsersContent() {
  const { can } = usePermissions();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  const search = useDebounce(searchInput, 400);

  const params = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      roleId: roleFilter === "all" ? undefined : roleFilter,
      onlyDeleted: showArchived || undefined,
    }),
    [pagination, search, statusFilter, roleFilter, showArchived],
  );

  const { data, isLoading, isError, error } = useUsers(params);
  const { data: rolesData } = useRoles({ limit: 100 });
  const { remove, restore } = useUserMutations();

  // Dialog state.
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [viewing, setViewing] = useState<ManagedUser | null>(null);
  const [pendingAction, setPendingAction] = useState<{ user: ManagedUser; type: "delete" | "restore" } | null>(null);

  const resetToFirstPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

  const columns = useMemo(
    () =>
      getUserColumns({
        can,
        currentUserId,
        onView: setViewing,
        onEdit: (u) => {
          setEditing(u);
          setFormOpen(true);
        },
        onDelete: (u) => setPendingAction({ user: u, type: "delete" }),
        onRestore: (u) => setPendingAction({ user: u, type: "restore" }),
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
      setPendingAction(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage user accounts, roles and access.">
        <Can permission="user.create">
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
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
              setSearchInput(e.target.value);
              resetToFirstPage();
            }}
            placeholder="Search name, email, code…"
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
            setRoleFilter(v);
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

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={showArchived}
            onCheckedChange={(v) => {
              setShowArchived(!!v);
              resetToFirstPage();
            }}
          />
          Show archived
        </label>
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
          onRowClick={setViewing}
          showColumnVisibility={false}
        />
      )}

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} />
      <UserViewDialog user={viewing} open={!!viewing} onOpenChange={(o) => !o && setViewing(null)} />
      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={(o) => !o && setPendingAction(null)}
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
