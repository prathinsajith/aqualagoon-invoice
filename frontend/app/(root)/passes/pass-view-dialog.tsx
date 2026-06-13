"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  IconCircleCheck,
  IconLogin,
  IconLogout,
  IconPlayerPause,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/rbac/confirm-dialog";
import { Can } from "@/components/permission-gate";
import { PassStatusBadge } from "@/components/passes/pass-status-badge";
import { DateText } from "@/components/date-text";
import { formatMoney } from "@/lib/format";
import { PASS_KIND_LABELS, formatDuration } from "@/lib/pass-format";
import { usePass, usePassMutations } from "@/hooks/queries/use-passes";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { UserPassStatus } from "@/types/pass";

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export function PassViewDialog({
  passId,
  open,
  onOpenChange,
}: {
  passId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: pass, isLoading } = usePass(open ? passId : null);
  const { activate, suspend, cancel, renew, entry, exit } = usePassMutations();
  const [confirm, setConfirm] = useState<null | "suspend" | "cancel">(null);

  const busy =
    activate.isPending ||
    suspend.isPending ||
    cancel.isPending ||
    renew.isPending ||
    entry.isPending ||
    exit.isPending;

  const run = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      toast.success(success);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const status: UserPassStatus | undefined = pass?.status;
  const canRenew = status === "ACTIVE" || status === "EXPIRED" || status === "SUSPENDED";
  const canCancel = status != null && status !== "CANCELLED";
  const hasOpenEntry = pass?.usageLogs.some((l) => l.exitTime === null) ?? false;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <DialogTitle className="truncate font-mono">
                {pass?.passNumber ?? "Pass"}
              </DialogTitle>
              {pass && <PassStatusBadge status={pass.status} />}
            </div>
            <DialogDescription>
              {pass ? pass.passType.name : "Pass details and usage history."}
            </DialogDescription>
          </DialogHeader>

          {isLoading || !pass ? (
            <div className="grid min-h-[20vh] place-items-center">
              <Spinner className="size-7" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Holder" value={pass.holderName ?? "Walk-in"} />
                <Field
                  label="Category"
                  value={`${PASS_KIND_LABELS[pass.passType.type]} · ${formatDuration(pass.passType.durationType, pass.passType.durationValue)}`}
                />
                <Field label="Starts" value={<DateText value={pass.startTime} withTime />} />
                <Field label="Expires" value={<DateText value={pass.expiryTime} withTime />} />
                <Field
                  label="Entries"
                  value={
                    pass.passType.entryType === "UNLIMITED"
                      ? "Unlimited"
                      : `${pass.remainingEntries ?? 0} remaining`
                  }
                />
                <Field
                  label="Entry type"
                  value={pass.passType.entryType === "UNLIMITED" ? "Unlimited" : "Limited entries"}
                />
                <Field label="Paid" value={formatMoney(pass.finalAmount)} />
                <Field
                  label="Activated"
                  value={pass.activatedAt ? <DateText value={pass.activatedAt} withTime /> : "—"}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 border-t pt-4">
                {status === "PENDING" && (
                  <Can permission="pass.activate">
                    <Button size="sm" disabled={busy} onClick={() => run(() => activate.mutateAsync(pass.id), "Pass activated")}>
                      <IconCircleCheck className="size-4" /> Activate
                    </Button>
                  </Can>
                )}
                {status === "ACTIVE" && (
                  <Can permission="pass.view">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => run(() => entry.mutateAsync({ id: pass.id }), "Entry recorded")}
                    >
                      <IconLogin className="size-4" /> Record entry
                    </Button>
                  </Can>
                )}
                {status === "ACTIVE" && hasOpenEntry && (
                  <Can permission="pass.view">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => run(() => exit.mutateAsync({ id: pass.id }), "Exit recorded")}
                    >
                      <IconLogout className="size-4" /> Record exit
                    </Button>
                  </Can>
                )}
                {canRenew && (
                  <Can permission="pass.renew">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => run(() => renew.mutateAsync({ id: pass.id }), "Pass renewed")}
                    >
                      <IconRefresh className="size-4" /> Renew
                    </Button>
                  </Can>
                )}
                {status === "ACTIVE" && (
                  <Can permission="pass.suspend">
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirm("suspend")}>
                      <IconPlayerPause className="size-4" /> Suspend
                    </Button>
                  </Can>
                )}
                {canCancel && (
                  <Can permission="pass.cancel">
                    <Button size="sm" variant="outline" className="text-destructive" disabled={busy} onClick={() => setConfirm("cancel")}>
                      <IconX className="size-4" /> Cancel
                    </Button>
                  </Can>
                )}
              </div>

              {/* Usage history */}
              <div className="space-y-2 border-t pt-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Usage history
                </p>
                {pass.usageLogs.length === 0 ? (
                  <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                    No entries recorded yet.
                  </p>
                ) : (
                  <div className="divide-y rounded-lg border">
                    {pass.usageLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="flex items-center gap-2">
                          <IconLogin className="size-3.5 text-emerald-500" />
                          <DateText value={log.entryTime} withTime />
                        </span>
                        <span className="text-muted-foreground">
                          {log.exitTime ? <DateText value={log.exitTime} withTime /> : "In progress"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm === "suspend"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Suspend this pass?"
        description="The holder won't be able to enter until the pass is renewed/reactivated."
        confirmLabel="Suspend"
        loading={suspend.isPending}
        onConfirm={async () => {
          if (!pass) return;
          await run(() => suspend.mutateAsync({ id: pass.id }), "Pass suspended");
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === "cancel"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Cancel this pass?"
        description="This permanently voids the pass. It can't be undone."
        confirmLabel="Cancel pass"
        destructive
        loading={cancel.isPending}
        onConfirm={async () => {
          if (!pass) return;
          await run(() => cancel.mutateAsync({ id: pass.id }), "Pass cancelled");
          setConfirm(null);
        }}
      />
    </>
  );
}
