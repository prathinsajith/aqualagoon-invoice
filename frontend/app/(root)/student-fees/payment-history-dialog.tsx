"use client";

import { IconReceipt } from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeeHistory } from "@/hooks/queries/use-training";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Read-only timeline of every payment received against a student's fees. */
export function PaymentHistoryDialog({
  open,
  onOpenChange,
  enrollmentId,
  studentName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollmentId: string | null;
  studentName: string;
}) {
  const { data: rows, isLoading } = useFeeHistory(enrollmentId, open);
  const total = (rows ?? [])
    .filter((r) => !r.cancelled)
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment history</DialogTitle>
          <DialogDescription>All payments received from {studentName}.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : !rows || rows.length === 0 ? (
          <p className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No payments recorded yet.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Total collected</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatMoney(total)}
              </span>
            </div>

            <div className="-mr-1 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              {rows.map((r, i) => (
                <div
                  key={`${r.invoiceId}-${i}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3",
                    r.cancelled && "opacity-60",
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <IconReceipt className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{r.feeName}</span>
                      {r.cancelled && (
                        <Badge variant="outline" className="border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">
                          Cancelled
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{r.invoiceNo}</span> · {formatDate(r.date)}
                      {r.method ? ` · ${r.method}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      r.cancelled
                        ? "text-muted-foreground line-through"
                        : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {formatMoney(r.amount)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
