"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";

import { roleFormSchema, RoleFormSchema } from "@/schemas/role";
import { useRoleMutations } from "@/hooks/queries/use-roles";
import { usePermissionCatalog } from "@/hooks/queries/use-permissions";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Permission, Role } from "@/types/rbac";

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
}

export function RoleFormDialog({ open, onOpenChange, role }: RoleFormDialogProps) {
  const isEdit = !!role;
  const { create, update } = useRoleMutations();
  const { data: catalog = [] } = usePermissionCatalog();

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of catalog) {
      const list = map.get(p.module) ?? [];
      list.push(p);
      map.set(p.module, list);
    }
    return [...map.entries()].toSorted((a, b) => a[0].localeCompare(b[0]));
  }, [catalog]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormSchema>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { name: "", description: "", permissionIds: [] },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: role?.name ?? "",
      description: role?.description ?? "",
      permissionIds: role?.permissions.map((p) => p.id) ?? [],
    });
  }, [open, role, reset]);

  const selected = watch("permissionIds") ?? [];

  const toggle = (id: string) => {
    setValue(
      "permissionIds",
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id],
      { shouldDirty: true },
    );
  };

  const toggleModule = (perms: Permission[], allSelected: boolean) => {
    const ids = perms.map((p) => p.id);
    setValue(
      "permissionIds",
      allSelected ? selected.filter((id) => !ids.includes(id)) : [...new Set([...selected, ...ids])],
      { shouldDirty: true },
    );
  };

  const onSubmit = async (values: RoleFormSchema) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      permissionIds: values.permissionIds,
    };
    try {
      if (isEdit && role) {
        await update.mutateAsync({ id: role.id, payload });
        toast.success("Role updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Role created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit role" : "Create role"}</DialogTitle>
          <DialogDescription>
            Set the role name and choose which permissions it grants.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {role?.isSystem && (
              <p className="text-xs text-muted-foreground">
                System role — you can rename it, but it can&apos;t be deleted.
              </p>
            )}
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea id="description" rows={2} placeholder="What this role is for" {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label>Permissions ({selected.length} selected)</Label>
            <div className="space-y-4 rounded-md border p-4">
              {grouped.length === 0 && (
                <p className="text-xs text-muted-foreground">No permissions available.</p>
              )}
              {grouped.map(([module, perms]) => {
                const allSelected = perms.every((p) => selected.includes(p.id));
                return (
                  <div key={module} className="space-y-2">
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="text-sm font-semibold capitalize">{module}</span>
                      <button
                        type="button"
                        onClick={() => toggleModule(perms, allSelected)}
                        className="text-xs text-primary hover:underline"
                      >
                        {allSelected ? "Clear" : "Select all"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {perms.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selected.includes(p.id)}
                            onCheckedChange={() => toggle(p.id)}
                          />
                          {p.action}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : isEdit ? "Save changes" : "Create role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
