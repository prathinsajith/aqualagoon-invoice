"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IconPrinter } from "@tabler/icons-react";
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
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

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

  const [feeId, setFeeId] = useState("");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [methodId, setMethodId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFeeId("");
    setAmount(undefined);
    setMethodId("");
  }, [open]);

  const selectedMethodId = methodId || methods[0]?.id || "";
  const selectedFee = outstanding.find((f) => f.id === feeId) ?? outstanding[0] ?? null;
  const balance = selectedFee ? round2(selectedFee.finalAmount - selectedFee.paidAmount) : 0;
  const payAmount = round2(Math.min(amount ?? balance, balance));
  const remaining = round2(Math.max(0, balance - payAmount));

  const onCollect = async () => {
    if (!selectedFee) return toast.error("No outstanding fee to collect");
    if (!selectedMethodId) return toast.error("Select a payment method");
    if (payAmount <= 0) return toast.error("Enter an amount to collect");

    setSubmitting(true);
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
      printReceipt(receipt);
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to collect payment"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Collect fee</DialogTitle>
          <DialogDescription>Take a payment from {studentName} and print the bill.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="grid h-32 place-items-center">
            <Spinner className="size-7" />
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
                <Select value={selectedFee?.id ?? ""} onValueChange={setFeeId}>
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
                <Select value={selectedMethodId} onValueChange={setMethodId}>
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
                  onChange={setAmount}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
