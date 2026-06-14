"use client";

import { useState } from "react";
import { IconCheck, IconShieldCheck } from "@tabler/icons-react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useRoles, useRoleMutations } from "@/hooks/queries/use-roles";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/rbac";

/**
 * Admin-only matrix that controls, per role, which roles its members may
 * assign/view when creating or managing users. Admins are unrestricted, so the
 * Admin role is shown as full-access and never appears as a delegatable option.
 */
export function RoleAccessMatrix() {
  const { data, isLoading } = useRoles({ limit: 100, sortBy: "name", sortOrder: "asc" });
  const { setAssignableRoles } = useRoleMutations();
  const [savingId, setSavingId] = useState<string | null>(null);

  const roles = data?.data ?? [];
  const editableRoles = roles.filter((r) => r.name !== "Admin");
  // You can't delegate the ability to grant Admin through this matrix.
  const options = roles.filter((r) => r.name !== "Admin");

  const toggle = async (role: Role, targetId: string) => {
    const next = new Set(role.assignableRoleIds);
    if (next.has(targetId)) next.delete(targetId);
    else next.add(targetId);
    setSavingId(role.id);
    try {
      await setAssignableRoles.mutateAsync({ id: role.id, assignableRoleIds: [...next] });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choose which roles each role may assign and view when creating users. Admins always have
        full access.
      </p>

      {/* Admin — always full access */}
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
        <IconShieldCheck className="size-5 text-emerald-500" />
        <div>
          <p className="text-sm font-semibold">Admin</p>
          <p className="text-xs text-muted-foreground">Full access to every role and user.</p>
        </div>
      </div>

      {editableRoles.map((role) => (
        <div key={role.id} className="rounded-xl border border-border/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{role.name}</p>
              {role.isSystem && (
                <Badge variant="secondary" className="text-[10px]">
                  System
                </Badge>
              )}
            </div>
            {savingId === role.id && <Spinner className="size-4" />}
          </div>

          <p className="mb-2 text-xs text-muted-foreground">Can assign &amp; view:</p>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const active = role.assignableRoleIds.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggle(role, opt.id)}
                  disabled={savingId === role.id}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:bg-muted",
                  )}
                >
                  {active && <IconCheck className="size-3.5" />}
                  {opt.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
