"use client";

import { useState } from "react";
import { IconPrinter, IconBan, IconBluetooth } from "@tabler/icons-react";
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
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/rbac/confirm-dialog";
import { Can } from "@/components/permission-gate";
import { InvoiceStatusBadge } from "@/components/billing/invoice-status-badge";
import { useInvoice, useInvoiceMutations } from "@/hooks/queries/use-invoices";
import { BillingService } from "@/services/billing-service";
import { printReceipt } from "@/lib/print-receipt";
import { printReceiptThermal, isThermalPrintingSupported } from "@/lib/thermal-printer";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";

export function InvoiceViewDialog({
  invoiceId,
  open,
  onOpenChange,
}: {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: invoice, isLoading } = useInvoice(open ? invoiceId : null);
  const { cancel } = useInvoiceMutations();
  const [printing, setPrinting] = useState(false);
  const [thermalPrinting, setThermalPrinting] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handlePrint = async () => {
    if (!invoiceId) return;
    setPrinting(true);
    try {
      printReceipt(await BillingService.receipt(invoiceId));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintThermal = async () => {
    if (!invoiceId) return;
    if (!isThermalPrintingSupported()) {
      toast.error(
        "Bluetooth printing needs Chrome/Edge or Android Chrome. On iPhone/iPad use “Print” instead.",
      );
      return;
    }
    setThermalPrinting(true);
    try {
      await printReceiptThermal(await BillingService.receipt(invoiceId));
      toast.success("Sent to printer");
    } catch (err) {
      if (err instanceof DOMException && (err.name === "NotFoundError" || err.name === "AbortError")) {
        return;
      }
      toast.error(err instanceof Error ? err.message : getApiErrorMessage(err));
    } finally {
      setThermalPrinting(false);
    }
  };

  const handleCancel = async () => {
    if (!invoiceId) return;
    try {
      await cancel.mutateAsync({ id: invoiceId });
      toast.success("Invoice cancelled and stock restored");
      setConfirmCancel(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <DialogTitle className="font-mono">{invoice?.invoiceNo ?? "Invoice"}</DialogTitle>
              {invoice && <InvoiceStatusBadge status={invoice.status} />}
            </div>
            <DialogDescription>
              {invoice ? new Date(invoice.createdAt).toLocaleString() : "Invoice details"}
            </DialogDescription>
          </DialogHeader>

          {isLoading || !invoice ? (
            <div className="grid h-40 place-items-center">
              <Spinner className="size-7" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Items */}
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Item</th>
                      <th className="px-3 py-2 text-center font-medium">Qty</th>
                      <th className="px-3 py-2 text-right font-medium">Price</th>
                      <th className="px-3 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoice.items.map((it) => (
                      <tr key={it.id}>
                        <td className="px-3 py-2">{it.itemName}</td>
                        <td className="px-3 py-2 text-center">{it.quantity}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatMoney(it.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums">
                          {formatMoney(it.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 rounded-lg border px-4 py-3 text-sm">
                <Row label="Subtotal" value={invoice.subtotal} />
                {invoice.discountAmount > 0 && <Row label="Discount" value={-invoice.discountAmount} />}
                <Row label="Tax" value={invoice.taxAmount} />
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>{formatMoney(invoice.totalAmount)}</span>
                </div>
                <Row label="Paid" value={invoice.paidAmount} />
                {invoice.balanceAmount > 0 && <Row label="Balance" value={invoice.balanceAmount} />}
              </div>

              {/* Payments */}
              {invoice.payments.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Payments
                  </p>
                  {invoice.payments.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span>
                        {p.paymentMethodName}
                        {p.transactionReference && (
                          <span className="text-muted-foreground"> · {p.transactionReference}</span>
                        )}
                      </span>
                      <span className="font-medium">{formatMoney(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <Can permission="billing.cancel">
              {invoice && invoice.status !== "CANCELLED" && (
                <Button variant="outline" onClick={() => setConfirmCancel(true)}>
                  <IconBan className="size-4" /> Cancel invoice
                </Button>
              )}
            </Can>
            <Can permission="invoice.print">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint} disabled={printing || !invoice}>
                  {printing ? <Spinner /> : <IconPrinter className="size-4" />} Print
                </Button>
                <Button onClick={handlePrintThermal} disabled={thermalPrinting || !invoice}>
                  {thermalPrinting ? <Spinner /> : <IconBluetooth className="size-4" />} Thermal printer
                </Button>
              </div>
            </Can>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this invoice?"
        description="The invoice will be marked cancelled and its products returned to stock. This can't be undone."
        confirmLabel="Cancel invoice"
        destructive
        loading={cancel.isPending}
        onConfirm={handleCancel}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{formatMoney(value)}</span>
    </div>
  );
}
