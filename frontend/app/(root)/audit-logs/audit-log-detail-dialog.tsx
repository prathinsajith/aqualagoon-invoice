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
import { DateText } from "@/components/date-text";
import { IconArrowRight } from "@tabler/icons-react";
import { useRoles } from "@/hooks/queries/use-roles";
import type { AuditLog } from "@/types/rbac";

// Technical / identifier fields we never surface as changes.
const SKIP = new Set([
  "id",
  "categoryId",
  "createdBy",
  "updatedBy",
  "code",
  "sku",
  "imageUrl",
  "photoUrl",
  "tokenVersion",
  "totpSecret",
  "passwordHash",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "productsCount",
  "usersCount",
]);

// Friendlier labels for keys that don't read well when auto-spaced.
const LABELS: Record<string, string> = {
  totpEnabled: "Two-factor",
  assignableRoleIds: "Assignable roles",
  minimumStock: "Minimum stock",
  stockQuantity: "Stock quantity",
  taxPercentage: "Tax %",
  dateFormat: "Date format",
  userCodePrefix: "User code prefix",
};

const titleCase = (s: string) =>
  s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();

const labelize = (key: string) => LABELS[key] ?? titleCase(key);

/** "PRODUCT_CATEGORY_UPDATE" -> "Product category updated". */
export function humanizeAction(action: string): string {
  const VERBS: Record<string, string> = {
    CREATE: "created",
    UPDATE: "updated",
    DELETE: "deleted",
    RESTORE: "restored",
    LOGIN: "signed in",
    LOGOUT: "signed out",
    LOGOUT_ALL: "signed out everywhere",
    ASSIGNMENT: "assignment changed",
  };
  const parts = action.split("_");
  const last = parts[parts.length - 1];
  if (VERBS[action]) return VERBS[action].replace(/^./, (c) => c.toUpperCase());
  if (last && VERBS[last]) {
    const subject = parts.slice(0, -1).join(" ").toLowerCase();
    return `${subject.charAt(0).toUpperCase()}${subject.slice(1)} ${VERBS[last]}`;
  }
  return titleCase(action.toLowerCase().replace(/_/g, " "));
}

/** Renders a stored value as a human label, resolving ids/objects to names. */
function useValueFormatter() {
  const { data } = useRoles({ limit: 100 });
  const roleName = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of data?.data ?? []) m.set(r.id, r.name);
    return m;
  }, [data]);

  return (key: string, v: unknown): string => {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    // Arrays: roles / permissions ([{name}]) or role-id lists.
    if (Array.isArray(v)) {
      if (v.length === 0) return "None";
      const names = v.map((item) => {
        if (item && typeof item === "object" && "name" in item) return String((item as { name: unknown }).name);
        if (typeof item === "string") return roleName.get(item) ?? item;
        return String(item);
      });
      return names.join(", ");
    }
    // Objects with a name (e.g. category).
    if (typeof v === "object") {
      const o = v as Record<string, unknown>;
      if ("name" in o) return String(o.name);
      return "—";
    }
    // Enum-ish UPPERCASE values.
    if (typeof v === "string" && /^[A-Z_]+$/.test(v)) {
      return v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " ");
    }
    return String(v);
  };
}

type Row = { key: string; before: unknown; after: unknown };

function diffRows(oldData: unknown, newData: unknown): Row[] {
  const o = (oldData ?? {}) as Record<string, unknown>;
  const n = (newData ?? {}) as Record<string, unknown>;
  const keys = Array.from(new Set([...Object.keys(o), ...Object.keys(n)]));
  return keys
    .filter((k) => !SKIP.has(k))
    .map((k) => ({ key: k, before: o[k], after: n[k] }))
    .filter((r) => JSON.stringify(r.before) !== JSON.stringify(r.after));
}

export function AuditLogDetailDialog({
  log,
  open,
  onOpenChange,
}: {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fmt = useValueFormatter();
  const hasOld = !!log?.oldData;
  const hasNew = !!log?.newData;
  const isUpdate = hasOld && hasNew;
  const rows = log ? diffRows(log.oldData, log.newData) : [];
  const snapshot = (log?.newData ?? log?.oldData ?? {}) as Record<string, unknown>;
  const snapshotRows = Object.keys(snapshot).filter((k) => !SKIP.has(k));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{log ? humanizeAction(log.action) : "Activity"}</DialogTitle>
          <DialogDescription>
            {log?.user ? `${log.user.firstName} ${log.user.lastName}` : "System"} ·{" "}
            <span className="capitalize">{log?.module}</span>
          </DialogDescription>
        </DialogHeader>

        {log && (
          <div className="space-y-5">
            {/* Who / when */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg bg-muted/40 p-4">
              <div className="space-y-0.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Performed by
                </p>
                <p className="text-sm font-medium">
                  {log.user ? `${log.user.firstName} ${log.user.lastName}` : "System"}
                </p>
                {log.user && <p className="text-xs text-muted-foreground">{log.user.email}</p>}
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  When
                </p>
                <p className="text-sm font-medium">
                  <DateText value={log.createdAt} withTime />
                </p>
                <p className="font-mono text-xs text-muted-foreground">{log.ipAddress || "—"}</p>
              </div>
            </div>

            {/* Changes */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {isUpdate ? "What changed" : hasNew ? "Details" : "Removed record"}
              </p>

              {isUpdate ? (
                rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No field changes recorded.</p>
                ) : (
                  <div className="divide-y rounded-lg border">
                    {rows.map((r) => (
                      <div key={r.key} className="grid grid-cols-[120px_1fr] gap-2 px-3 py-2.5 text-sm">
                        <span className="font-medium">{labelize(r.key)}</span>
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="text-muted-foreground line-through">
                            {fmt(r.key, r.before)}
                          </span>
                          <IconArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="font-medium">{fmt(r.key, r.after)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )
              ) : snapshotRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No details recorded.</p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {snapshotRows.map((k) => (
                    <div key={k} className="grid grid-cols-[120px_1fr] gap-2 px-3 py-2.5 text-sm">
                      <span className="font-medium">{labelize(k)}</span>
                      <span>{fmt(k, snapshot[k])}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
