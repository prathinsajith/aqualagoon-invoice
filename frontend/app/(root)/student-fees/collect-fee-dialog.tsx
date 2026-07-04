"use client";

import { useMemo, useReducer } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IconBluetooth, IconCircleCheck, IconPrinter } from "@tabler/icons-react";
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
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useStudentFees } from "@/hooks/queries/use-training";
import { usePaymentMethods } from "@/hooks/queries/use-payment-methods";
import { BillingService } from "@/services/billing-service";
import { printReceipt } from "@/lib/print-receipt";
import { printReceiptThermal, isThermalPrintingSupported } from "@/lib/thermal-printer";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Receipt } from "@/types/billing";

/** The printable result shown after a fee is collected. */
interface CollectedReceipt {
  invoiceNo: string;
  studentName: string;
  amount: number;
  remaining: number;
  receipt: Receipt;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

interface CollectForm {
  feeId: string;
  amount: number | undefined;
  methodId: string;
}
interface CollectStatus {
  submitting: boolean;
  thermalPrinting: boolean;
  done: CollectedReceipt | null;
}

/** Collects a payment against an enrollment's outstanding training fee(s). */
export function CollectFeeDialog({
  open,
  onOpenChange,
  enrollmentId,
  studentName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollmentId: string;
  studentName: string;
}) {
  const qc = useQueryClient();
  const { data: feesData, isLoading } = useStudentFees({
    enrollmentId,
    outstanding: true,
    limit: 50,
    sortBy: "createdAt",
    sortOrder: "asc",
  });
  const outstanding = useMemo(
    () => (feesData?.data ?? []).filter((f) => f.finalAmount - f.paidAmount > 0),
    [feesData],
  );

  const { data: methodsData } = usePaymentMethods({ isActive: true, limit: 100 });
  const methods = methodsData?.data ?? [];

  // Grouped in reducers so one logical update is a single render. No reset
  // effect needed: the parent mounts this dialog only while a row is selected
  // (`{collecting && <CollectFeeDialog … />}`), so every open is a fresh mount.
  const [form, patchForm] = useReducer(
    (s: CollectForm, p: Partial<CollectForm>) => ({ ...s, ...p }),
    { feeId: "", amount: undefined, methodId: "" },
  );
  const [status, patchStatus] = useReducer(
    (s: CollectStatus, p: Partial<CollectStatus>) => ({ ...s, ...p }),
    { submitting: false, thermalPrinting: false, done: null },
  );
  const { feeId, amount, methodId } = form;
  // `done` is set after a successful collection so the bill can be printed.
  const { submitting, thermalPrinting, done } = status;

  /** Print the collected bill to a Bluetooth thermal printer (ESC/POS). */
  const handleThermal = async () => {
    if (!done) return;
    if (!isThermalPrintingSupported()) {
      toast.error(
        "Bluetooth printing needs Chrome/Edge or Android Chrome. On iPhone/iPad use “Print bill” instead.",
      );
      return;
    }
    patchStatus({ thermalPrinting: true });
    try {
      await printReceiptThermal(done.receipt);
      toast.success("Sent to printer");
    } catch (err) {
      // User cancelled the device chooser — not an error.
      if (err instanceof DOMException && (err.name === "NotFoundError" || err.name === "AbortError")) {
        return;
      }
      toast.error(err instanceof Error ? err.message : getApiErrorMessage(err));
    } finally {
      patchStatus({ thermalPrinting: false });
    }
  };

  const selectedMethodId = methodId || methods[0]?.id || "";
  const selectedFee = outstanding.find((f) => f.id === feeId) ?? outstanding[0] ?? null;
  const balance = selectedFee ? round2(selectedFee.finalAmount - selectedFee.paidAmount) : 0;
  const payAmount = round2(Math.min(amount ?? balance, balance));
  const remaining = round2(Math.max(0, balance - payAmount));

  const onCollect = async () => {
    if (!selectedFee) return toast.error("No outstanding fee to collect");
    if (!selectedMethodId) return toast.error("Select a payment method");
    if (payAmount <= 0) return toast.error("Enter an amount to collect");

    patchStatus({ submitting: true });
    try {
      const invoice = await BillingService.payFee(selectedFee.id, {
        amount: payAmount,
        paymentMethodId: selectedMethodId,
      });
      qc.invalidateQueries({ queryKey: ["student-fees"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      const receipt = await BillingService.receipt(invoice.id);
      toast.success(`Collected ${formatMoney(payAmount)} · invoice ${invoice.invoiceNo}`);
      patchStatus({
        done: {
          invoiceNo: invoice.invoiceNo,
          studentName,
          amount: payAmount,
          remaining,
          receipt,
        },
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to collect payment"));
    } finally {
      patchStatus({ submitting: false });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{done ? "Payment collected" : "Collect fee"}</DialogTitle>
          <DialogDescription>
            {done
              ? "The fee has been collected — print the bill below."
              : `Take a payment from ${studentName} and print the bill.`}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-1.5 rounded-xl border bg-muted/30 p-5 text-center">
            <span className="mb-1 grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
              <IconCircleCheck className="size-7" />
            </span>
            <p className="text-sm">
              <span className="font-semibold">{done.studentName}</span>
            </p>
            <p className="font-mono text-xs text-muted-foreground">{done.invoiceNo}</p>
            <p className="text-2xl font-bold tracking-tight">{formatMoney(done.amount)} paid</p>
            {done.remaining > 0 && (
              <p className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Balance {formatMoney(done.remaining)} pending
              </p>
            )}
          </div>
        ) : isLoading ? (
          <div className="space-y-4 py-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className="flex justify-between border-t pt-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ) : outstanding.length === 0 ? (
          <p className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Nothing outstanding — this student is fully paid.
          </p>
        ) : (
          <div className="space-y-4">
            {outstanding.length > 1 && (
              <div className="space-y-1.5">
                <Label>Fee</Label>
                <Select value={selectedFee?.id ?? ""} onValueChange={(v) => patchForm({ feeId: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {outstanding.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.feePlan?.name ?? "Fee"} · balance {formatMoney(f.finalAmount - f.paidAmount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Balance due</span>
              <span className="text-base font-bold">{formatMoney(balance)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Payment method</Label>
                <Select value={selectedMethodId} onValueChange={(v) => patchForm({ methodId: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="collect-amt">Collecting</Label>
                <NumberInput
                  id="collect-amt"
                  value={amount ?? balance}
                  onChange={(v) => patchForm({ amount: v })}
                  min={0}
                  max={balance}
                  decimals
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-2 text-sm">
              <span className="text-muted-foreground">Remaining after</span>
              <span className={cn("font-semibold", remaining > 0 && "text-amber-600 dark:text-amber-400")}>
                {formatMoney(remaining)}
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          {done ? (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Done
              </Button>
              <Button type="button" variant="outline" onClick={() => printReceipt(done.receipt)}>
                <IconPrinter className="size-4" /> Print bill
              </Button>
              <Button type="button" onClick={handleThermal} disabled={thermalPrinting}>
                {thermalPrinting ? <Spinner /> : <IconBluetooth className="size-4" />} Thermal printer
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onCollect}
                disabled={submitting || outstanding.length === 0 || payAmount <= 0}
              >
                {submitting ? <Spinner /> : (
                  <>
                    <IconPrinter className="size-4" /> Collect {formatMoney(payAmount)}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
