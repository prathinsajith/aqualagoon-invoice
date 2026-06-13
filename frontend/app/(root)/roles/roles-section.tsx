"use client";

import { useMemo, useState } from "react";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/rbac/confirm-dialog";
import { Can } from "@/components/permission-gate";
import { DataTableGeneric } from "@/components/data-table-generic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

import { getRoleColumns } from "./columns";
import { RoleFormDialog } from "./role-form-dialog";
import { RoleViewDialog } from "./role-view-dialog";
import { useRoles, useRoleMutations } from "@/hooks/queries/use-roles";
import { usePermissions } from "@/hooks/usePermissions";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Role } from "@/types/rbac";

/** Role management UI — usable standalone or inside the Settings "Roles" tab. */
export function RolesSection() {
  const { can } = usePermissions();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 400);

  // Load all roles (small set) so drag-reordering acts on the whole list.
  const { data, isLoading, isError, error } = useRoles({ limit: 100, search: search || undefined });
  const { remove, reorder } = useRoleMutations();
  const canReorder = can("role.update") && !search;

  // Optimistic drag order; cleared once the server data (now reordered) returns.
  const [override, setOverride] = useState<Role[] | null>(null);
  const list = override ?? data?.data ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [viewing, setViewing] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);

  const columns = useMemo(
    () =>
      getRoleColumns({
        can,
        onView: setViewing,
        onEdit: (r) => {
          setEditing(r);
          setFormOpen(true);
        },
        onDelete: setDeleting,
      }),
    [can],
  );

  const handleReorder = (next: Role[]) => {
    setOverride(next);
    reorder.mutate(next.map((r) => r.id), {
      onSuccess: () => setOverride(null),
      onError: (err) => {
        setOverride(null);
        toast.error(getApiErrorMessage(err));
      },
    });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Role deleted");
      setDeleting(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Define roles and the permissions they grant. Drag to set the order shown when assigning roles.
        </p>
        <Can permission="role.create">
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <IconPlus className="size-4" /> New role
          </Button>
        </Can>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search roles…"
          className="pl-9"
        />
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {getApiErrorMessage(error, "Failed to load roles")}
        </div>
      ) : isLoading && !data ? (
        <div className="grid min-h-[30vh] place-items-center">
          <Spinner className="size-8" />
        </div>
      ) : (
        <DataTableGeneric
          columns={columns}
          data={list}
          showColumnVisibility={false}
          showPagination={false}
          onReorder={canReorder ? handleReorder : undefined}
        />
      )}

      <RoleFormDialog open={formOpen} onOpenChange={setFormOpen} role={editing} />
      <RoleViewDialog role={viewing} open={!!viewing} onOpenChange={(o) => !o && setViewing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete role?"
        description={`"${deleting?.name}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
