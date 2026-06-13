"use client";

import { IconBluetooth, IconPrinter, IconTicket } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReceiptView } from "@/components/billing/receipt-view";
import { DateText } from "@/components/date-text";
import { formatMoney } from "@/lib/format";
import type { IssuedPass, Receipt } from "@/types/billing";

export interface CompletedSale {
  receipt: Receipt;
  change: number;
  passes: IssuedPass[];
}

/** Post-sale receipt: change due, any issued passes, and print actions. */
export function PosReceiptDialog({
  completed,
  onClose,
  onPrint,
  onThermal,
}: {
  completed: CompletedSale | null;
  onClose: () => void;
  onPrint: () => void;
  onThermal: () => void;
}) {
  return (
    <Dialog open={!!completed} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sale complete</DialogTitle>
        </DialogHeader>
        {completed && (
          <div className="space-y-4">
            {completed.change > 0 && (
              <div className="rounded-lg bg-emerald-50 p-3 text-center text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                Change due: <span className="text-lg font-bold">{formatMoney(completed.change)}</span>
              </div>
            )}
            {completed.passes.length > 0 && (
              <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                  <IconTicket className="size-4" /> Passes issued
                </p>
                {completed.passes[0]?.holderName && (
                  <p className="text-xs text-muted-foreground">
                    Holder:{" "}
                    <span className="font-medium text-foreground">
                      {completed.passes[0].holderName}
                    </span>
                  </p>
                )}
                <div className="space-y-2">
                  {completed.passes.map((p) => (
                    <div key={p.id} className="flex items-start justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate">{p.passTypeName}</span>
                      <span className="flex flex-col items-end text-right">
                        <span className="font-mono text-xs font-medium">{p.passNumber}</span>
                        <span className="text-[11px] text-muted-foreground">
                          Expires <DateText value={p.expiryTime} withTime />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-lg border">
              <ReceiptView receipt={completed.receipt} />
            </div>
          </div>
        )}
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            New sale
          </Button>
          {completed && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onPrint}>
                <IconPrinter className="size-4" /> Print
              </Button>
              <Button onClick={onThermal}>
                <IconBluetooth className="size-4" /> Thermal printer
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
