"use client";

import { IconReceipt } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/format";
import type { PaymentMethod } from "@/types/billing";

/** Take-payment step: method, optional pass holder, tendered amount and change. */
export function PosPaymentDialog({
  open,
  onOpenChange,
  total,
  cartCount,
  methods,
  selectedMethodId,
  onMethod,
  hasPassInCart,
  holderName,
  onHolder,
  paidAmount,
  onPaid,
  change,
  paid,
  canCheckout,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  cartCount: number;
  methods: PaymentMethod[];
  selectedMethodId: string;
  onMethod: (id: string) => void;
  hasPassInCart: boolean;
  holderName: string;
  onHolder: (name: string) => void;
  paidAmount: number | undefined;
  onPaid: (value: number | undefined) => void;
  change: number;
  paid: number;
  canCheckout: boolean;
  pending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl bg-muted/40 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Amount due</p>
            <p className="text-3xl font-bold tracking-tight">{formatMoney(total)}</p>
            <p className="text-xs text-muted-foreground">{cartCount} item(s)</p>
          </div>

          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <Select value={selectedMethodId} onValueChange={onMethod}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {methods.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No active payment methods
                  </div>
                )}
                {methods.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasPassInCart && (
            <div className="space-y-1.5">
              <Label htmlFor="holder">Pass holder name</Label>
              <Input
                id="holder"
                value={holderName}
                onChange={(e) => onHolder(e.target.value)}
                placeholder="Who is this pass for?"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="paid">Paid amount</Label>
              <NumberInput id="paid" value={paidAmount} onChange={onPaid} min={0} decimals />
            </div>
            <div className="space-y-1.5">
              <Label>Change</Label>
              <div className="flex h-10 items-center rounded-lg border bg-muted/30 px-3 text-sm font-semibold">
                {formatMoney(change)}
              </div>
            </div>
          </div>

          {paid > 0 && paid < total && (
            <p className="text-xs text-destructive">
              Full payment required — {formatMoney(total - paid)} short.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back to cart
          </Button>
          <Button disabled={!canCheckout || pending} onClick={onConfirm}>
            {pending ? (
              <Spinner />
            ) : (
              <>
                <IconReceipt className="size-4" /> Confirm {formatMoney(total)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
