"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerSelect } from "@/components/billing/customer-select";

import { useBatches, useFeePlans, useEnrollmentMutations } from "@/hooks/queries/use-training";
import { usePaymentMethods } from "@/hooks/queries/use-payment-methods";
import { StudentFeeService } from "@/services/training-service";
import { BillingService } from "@/services/billing-service";
import { printReceipt } from "@/lib/print-receipt";
import { printReceiptThermal, isThermalPrintingSupported } from "@/lib/thermal-printer";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Receipt } from "@/types/billing";
import type { ManagedUser } from "@/types/rbac";

/** The printable result shown after an admission fee is collected. */
interface AdmissionReceipt {
  invoiceNo: string;
  studentName: string;
  amount: number;
  remaining: number;
  receipt: Receipt;
}

interface EnrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function EnrollDialog({ open, onOpenChange }: EnrollDialogProps) {
  const qc = useQueryClient();
  const [student, setStudent] = useState<ManagedUser | null>(null);
  const [batchId, setBatchId] = useState("");
  const [feePlanId, setFeePlanId] = useState("");
  // Admission billing: collect the fee + raise a paid invoice in the same step.
  const [collectNow, setCollectNow] = useState(true);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [discount, setDiscount] = useState<number | undefined>(undefined);
  // How much to collect at admission — defaults to the full amount due; a lower
  // value leaves a balance the student can clear later.
  const [payNow, setPayNow] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [thermalPrinting, setThermalPrinting] = useState(false);
  // Set after a successful admit+charge so the bill can be printed.
  const [done, setDone] = useState<AdmissionReceipt | null>(null);

  /** Print the admission bill to a Bluetooth thermal printer (ESC/POS). */
  const handleThermal = async () => {
    if (!done) return;
    if (!isThermalPrintingSupported()) {
      toast.error(
        "Bluetooth printing needs Chrome/Edge or Android Chrome. On iPhone/iPad use “Print bill” instead.",
      );
      return;
    }
    setThermalPrinting(true);
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
      setThermalPrinting(false);
    }
  };

  const { create } = useEnrollmentMutations();

  const { data: batchesData } = useBatches({ page: 1, limit: 100, status: "ACTIVE" });
  const batches = batchesData?.data ?? [];

  const { data: feePlansData } = useFeePlans({ page: 1, limit: 100, status: "ACTIVE" });
  const feePlans = feePlansData?.data ?? [];

  const { data: methodsData } = usePaymentMethods({ isActive: true, limit: 100 });
  const methods = methodsData?.data ?? [];
  const selectedMethodId = paymentMethodId || methods[0]?.id || "";

  useEffect(() => {
    if (!open) return;
    setStudent(null);
    setBatchId("");
    setFeePlanId("");
    setCollectNow(true);
    setPaymentMethodId("");
    setDiscount(undefined);
    setPayNow(undefined);
    setDone(null);
  }, [open]);

  // The program backing the chosen batch, used to narrow the fee-plan list.
  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === batchId) ?? null,
    [batches, batchId],
  );

  const filteredFeePlans = useMemo(() => {
    if (!selectedBatch) return feePlans;
    const programId = selectedBatch.program.id;
    const narrowed = feePlans.filter((p) => p.program.id === programId);
    return narrowed.length > 0 ? narrowed : feePlans;
  }, [feePlans, selectedBatch]);

  useEffect(() => {
    if (feePlanId && !filteredFeePlans.some((p) => p.id === feePlanId)) {
      setFeePlanId("");
    }
  }, [filteredFeePlans, feePlanId]);

  const selectedPlan = feePlans.find((p) => p.id === feePlanId) ?? null;
  const planAmount = selectedPlan?.amount ?? 0;
  const amountDue = round2(Math.max(0, planAmount - (discount ?? 0)));
  // Default to collecting the full amount; clamp a typed value to the amount due.
  const payingNow = round2(Math.min(payNow ?? amountDue, amountDue));
  const remaining = round2(Math.max(0, amountDue - payingNow));

  const onSubmit = async () => {
    if (!student) return toast.error("Select a student to enroll");
    if (!batchId) return toast.error("Select a batch");
    if (collectNow && !feePlanId) return toast.error("Pick a fee plan to collect the admission fee");
    if (collectNow && !selectedMethodId) return toast.error("Select a payment method");

    setSubmitting(true);
    try {
      // 1. Admit the student (validates capacity / duplicate; bumps strength).
      const enrollment = await create.mutateAsync({
        studentId: student.id,
        batchId,
        feePlanId: feePlanId || null,
      });

      // 2. Collect the fee now → generate the charge, then take the payment
      //    (which may be partial, leaving a balance).
      if (collectNow && feePlanId) {
        const fee = await StudentFeeService.create({
          enrollmentId: enrollment.id,
          feePlanId,
          discountAmount: discount ?? 0,
        });
        qc.invalidateQueries({ queryKey: ["student-fees"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });

        if (payingNow > 0) {
          const invoice = await BillingService.payFee(fee.id, {
            amount: payingNow,
            paymentMethodId: selectedMethodId,
          });
          qc.invalidateQueries({ queryKey: ["invoices"] });
          const receipt = await BillingService.receipt(invoice.id);
          toast.success(`Admitted ${student.firstName} · invoice ${invoice.invoiceNo}`);
          setDone({
            invoiceNo: invoice.invoiceNo,
            studentName: `${student.firstName} ${student.lastName}`.trim(),
            amount: payingNow,
            remaining,
            receipt,
          });
          return;
        }
        // No money collected now — the fee stays pending for later.
        toast.success(`Admitted ${student.firstName} · fee pending (${formatMoney(amountDue)})`);
        onOpenChange(false);
        return;
      }
      toast.success(`Admitted ${student.firstName}`);
      onOpenChange(false);
    } catch (err) {
      // Enrollment may have succeeded even if billing failed — the message guides next steps.
      toast.error(getApiErrorMessage(err, "Failed to enroll student"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{done ? "Admission complete" : "Enroll student"}</DialogTitle>
          <DialogDescription>
            {done
              ? "The admission fee has been collected — print the bill below."
              : "Admit a student to a batch and collect the fee."}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-1.5 rounded-xl border bg-muted/30 p-5 text-center">
            <span className="mb-1 grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
              <IconCircleCheck className="size-7" />
            </span>
            <p className="text-sm">
              <span className="font-semibold">{done.studentName}</span> admitted
            </p>
            <p className="font-mono text-xs text-muted-foreground">{done.invoiceNo}</p>
            <p className="text-2xl font-bold tracking-tight">{formatMoney(done.amount)} paid</p>
            {done.remaining > 0 && (
              <p className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Balance {formatMoney(done.remaining)} pending
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Student</Label>
              <CustomerSelect value={student} onChange={setStudent} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="batchId">Batch</Label>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger id="batchId" className="w-full">
                <SelectValue placeholder="Select a batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No active batches available.
                  </div>
                )}
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} — {b.program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feePlanId">Fee plan</Label>
            <Select
              value={feePlanId || "none"}
              onValueChange={(v) => setFeePlanId(v === "none" ? "" : v)}
            >
              <SelectTrigger id="feePlanId" className="w-full">
                <SelectValue placeholder="No fee plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No fee plan</SelectItem>
                {filteredFeePlans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {formatMoney(p.amount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Collect the admission fee right now (raises a paid invoice). */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <label htmlFor="collect-now" className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                id="collect-now"
                checked={collectNow}
                onCheckedChange={(v) => setCollectNow(!!v)}
              />
              Collect fee now (generate invoice)
            </label>

            {collectNow && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Payment method</Label>
                    <Select value={selectedMethodId} onValueChange={setPaymentMethodId}>
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
                    <Label htmlFor="disc">Discount</Label>
                    <NumberInput
                      id="disc"
                      value={discount}
                      onChange={setDiscount}
                      min={0}
                      decimals
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="paynow">Paying now</Label>
                    <NumberInput
                      id="paynow"
                      value={payNow ?? amountDue}
                      onChange={setPayNow}
                      min={0}
                      max={amountDue}
                      decimals
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Remaining</Label>
                    <div
                      className={cn(
                        "flex h-9 items-center rounded-md border bg-background px-3 text-sm font-semibold",
                        remaining > 0 && "text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {formatMoney(remaining)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t pt-2 text-sm">
                  <span className="text-muted-foreground">
                    Fee {formatMoney(amountDue)}
                    {remaining > 0 ? " · partial payment" : ""}
                  </span>
                  <span className="text-base font-bold">{formatMoney(payingNow)}</span>
                </div>
              </div>
            )}
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
              <Button type="button" onClick={onSubmit} disabled={submitting}>
                {submitting ? (
                  <Spinner />
                ) : collectNow && payingNow > 0 ? (
                  `Admit & charge ${formatMoney(payingNow)}`
                ) : (
                  "Admit student"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
