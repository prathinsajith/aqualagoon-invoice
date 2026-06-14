"use client";

import { useMemo, useReducer } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { IconPlus, IconPencil, IconTrash, IconDotsVertical } from "@tabler/icons-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/rbac/confirm-dialog";
import { Can } from "@/components/permission-gate";
import { DataTableGeneric } from "@/components/data-table-generic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshButton } from "@/components/refresh-button";
import { PaymentMethodFormDialog } from "@/components/billing/payment-method-form-dialog";
import { usePaymentMethods, usePaymentMethodMutations } from "@/hooks/queries/use-payment-methods";
import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/lib/api-error";
import type { PaymentMethod } from "@/types/billing";

interface PaymentMethodsUi {
  form: boolean;
  editing: PaymentMethod | null;
  pendingDelete: PaymentMethod | null;
  pendingToggle: PaymentMethod | null;
  /** Optimistic drag order; cleared once the reordered server data returns. */
  override: PaymentMethod[] | null;
}

const INITIAL_UI: PaymentMethodsUi = {
  form: false,
  editing: null,
  pendingDelete: null,
  pendingToggle: null,
  override: null,
};

export function PaymentMethodsSection() {
  const { can } = usePermissions();
  const canUpdate = can("payment_method.update");
  const { data, isLoading, isError, error } = usePaymentMethods({ limit: 100 });
  const { update, remove, reorder } = usePaymentMethodMutations();

  // One reducer for all dialog/interaction state — a single update, one render.
  const [ui, patchUi] = useReducer(
    (state: PaymentMethodsUi, patch: Partial<PaymentMethodsUi>) => ({ ...state, ...patch }),
    INITIAL_UI,
  );
  const { form: formOpen, editing, pendingDelete, pendingToggle, override } = ui;
  const list = override ?? data?.data ?? [];

  const handleReorder = (next: PaymentMethod[]) => {
    patchUi({ override: next });
    reorder.mutate(next.map((m) => m.id), {
      onSuccess: () => patchUi({ override: null }),
      onError: (err) => {
        patchUi({ override: null });
        toast.error(getApiErrorMessage(err));
      },
    });
  };

  const confirmToggle = async () => {
    if (!pendingToggle) return;
    try {
      await update.mutateAsync({
        id: pendingToggle.id,
        payload: { isActive: !pendingToggle.isActive },
      });
      toast.success(pendingToggle.isActive ? "Deactivated" : "Activated");
      patchUi({ pendingToggle: null });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await remove.mutateAsync(pendingDelete.id);
      toast.success("Payment method deleted");
      patchUi({ pendingDelete: null });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const columns = useMemo<ColumnDef<PaymentMethod>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            {row.original.description && (
              <span className="line-clamp-1 text-xs text-muted-foreground">
                {row.original.description}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "usage",
        header: "Used in",
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-normal">
            {row.original.usageCount} payments
          </Badge>
        ),
      },
      {
        id: "status",
        header: "Active",
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={row.original.isActive}
              onCheckedChange={() => patchUi({ pendingToggle: row.original })}
              disabled={!canUpdate || update.isPending}
            />
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <IconDotsVertical className="size-4" />
                    <span className="sr-only">Open actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Can permission="payment_method.update">
                    <DropdownMenuItem onClick={() => patchUi({ editing: m, form: true })}>
                      <IconPencil className="size-4" /> Edit
                    </DropdownMenuItem>
                  </Can>
                  <Can permission="payment_method.delete">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => patchUi({ pendingDelete: m })}>
                      <IconTrash className="size-4" /> Delete
                    </DropdownMenuItem>
                  </Can>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [canUpdate, update.isPending],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Payment methods available to cashiers at checkout. Drag to reorder; inactive methods are hidden from billing.
        </p>
        <div className="flex items-center gap-3">
          <RefreshButton queryKey={["payment-methods"]} />
          <Can permission="payment_method.create">
            <Button size="sm" onClick={() => patchUi({ editing: null, form: true })}>
              <IconPlus className="size-4" /> New method
            </Button>
          </Can>
        </div>
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {getApiErrorMessage(error, "Failed to load payment methods")}
        </div>
      ) : isLoading && !data ? (
        <div className="grid min-h-[20vh] place-items-center">
          <Spinner className="size-7" />
        </div>
      ) : (
        <DataTableGeneric
          columns={columns}
          data={list}
          showPagination={false}
          onReorder={canUpdate ? handleReorder : undefined}
          showColumnVisibility={false}
        />
      )}

      <PaymentMethodFormDialog
        open={formOpen}
        onOpenChange={(o) => patchUi({ form: o })}
        method={editing}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && patchUi({ pendingDelete: null })}
        title="Delete payment method?"
        description="It will be removed from billing. Methods already used in payments can't be deleted."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
      <ConfirmDialog
        open={!!pendingToggle}
        onOpenChange={(o) => !o && patchUi({ pendingToggle: null })}
        title={pendingToggle?.isActive ? "Deactivate payment method?" : "Activate payment method?"}
        description={
          pendingToggle?.isActive
            ? `“${pendingToggle?.name}” will no longer be selectable when taking payments.`
            : `“${pendingToggle?.name}” will become available when taking payments.`
        }
        confirmLabel={pendingToggle?.isActive ? "Deactivate" : "Activate"}
        destructive={pendingToggle?.isActive}
        loading={update.isPending}
        onConfirm={confirmToggle}
      />
    </div>
  );
}
