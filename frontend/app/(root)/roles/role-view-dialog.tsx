"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Permission, Role } from "@/types/rbac";

export function RoleViewDialog({
  role,
  open,
  onOpenChange,
}: {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of role?.permissions ?? []) {
      const list = map.get(p.module) ?? [];
      list.push(p);
      map.set(p.module, list);
    }
    return [...map.entries()].toSorted((a, b) => a[0].localeCompare(b[0]));
  }, [role]);

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {role.name}
            {role.isSystem && <Badge variant="outline">System</Badge>}
          </DialogTitle>
          <DialogDescription>{role.description || "No description"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-muted-foreground">Assigned users:</span> {role.usersCount}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Permissions:</span> {role.permissions.length}
          </p>
        </div>

        <div className="space-y-3">
          {grouped.length === 0 && (
            <p className="text-sm text-muted-foreground">This role has no permissions.</p>
          )}
          {grouped.map(([module, perms]) => (
            <div key={module} className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground capitalize">
                {module}
              </p>
              <div className="flex flex-wrap gap-1">
                {perms.map((p) => (
                  <Badge key={p.id} variant="secondary" className="font-normal">
                    {p.action}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
