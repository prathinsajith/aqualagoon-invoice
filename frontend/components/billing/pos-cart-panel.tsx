"use client";

import {
  IconReceipt,
  IconSchool,
  IconShoppingCart,
  IconTicket,
  IconTrash,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { CustomerSelect } from "@/components/billing/customer-select";
import { formatMoney } from "@/lib/format";
import { isPass, isSingleQtyPass, isTraining, lineKey, lineTotals } from "./pos-utils";
import type { CartLine, CartTotals } from "./pos-utils";
import type { ManagedUser } from "@/types/rbac";

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{formatMoney(value)}</span>
    </div>
  );
}

/** Customer picker, cart line items, running totals, and the charge button. */
export function PosCartPanel({
  cart,
  totals,
  customer,
  customerInvalid,
  onCustomer,
  onClear,
  onQty,
  onDiscount,
  onRemove,
  onCharge,
}: {
  cart: CartLine[];
  totals: CartTotals;
  customer: ManagedUser | null;
  customerInvalid?: boolean;
  onCustomer: (customer: ManagedUser | null) => void;
  onClear: () => void;
  onQty: (key: string, qty: number) => void;
  onDiscount: (key: string, amount: number) => void;
  onRemove: (key: string) => void;
  onCharge: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-col gap-4 lg:col-span-2">
      <div className="shrink-0 space-y-1.5">
        <Label>
          Customer <span className="text-destructive">*</span>
        </Label>
        <CustomerSelect value={customer} onChange={onCustomer} invalid={customerInvalid} />
        {customerInvalid && (
          <p className="text-xs text-destructive">Please select a customer before charging.</p>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2 font-semibold">
            <IconShoppingCart className="size-4" /> Cart ({cart.length})
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          )}
        </div>

        <div className="min-h-0 flex-1 divide-y overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <IconShoppingCart className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Tap a product or pass to add it to the cart.
              </p>
            </div>
          ) : (
            cart.map((line) => {
              const t = lineTotals(line);
              const key = lineKey(line.item);
              const pass = isPass(line.item);
              const training = isTraining(line.item);
              const single = isSingleQtyPass(line.item);
              return (
                <div key={key} className="space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {pass && <IconTicket className="size-3.5 shrink-0 text-primary" />}
                        {training && <IconSchool className="size-3.5 shrink-0 text-emerald-500" />}
                        {line.item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(line.item.price)}
                        {training ? " · fee" : pass ? " · pass" : ` · ${line.item.taxPercentage}% tax`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(key)}
                      aria-label={`Remove ${line.item.name} from cart`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <IconTrash className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <NumberInput
                      // Typeable quantity with +/- steppers. `setQty` clamps the
                      // result (passes min 1, products to stock, student passes
                      // locked to 1), so an emptied field commits back to 1.
                      value={line.quantity}
                      onChange={(v) => onQty(key, v ?? 1)}
                      min={1}
                      max={pass ? undefined : (line.item.stockQuantity ?? 1)}
                      disabled={single}
                      className="h-9 w-24 sm:w-32"
                    />
                    {!pass && !training && (
                      <div className="flex items-center gap-1.5">
                        <Label className="text-[11px] text-muted-foreground">Disc</Label>
                        <NumberInput
                          // Render a zero discount as an empty field (placeholder "0")
                          // so it can be cleared and typed into without snapping back.
                          value={line.discountAmount || undefined}
                          onChange={(v) => onDiscount(key, v ?? 0)}
                          min={0}
                          decimals
                          hideSteppers
                          placeholder="0"
                          className="h-8 w-16 sm:w-20"
                        />
                      </div>
                    )}
                    <span className="w-16 shrink-0 text-right text-sm font-semibold sm:w-20">{formatMoney(t.total)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="shrink-0 space-y-1.5 border-t px-4 py-3 text-sm">
          <Row label="Subtotal" value={totals.subtotal} />
          {totals.discount > 0 && <Row label="Discount" value={-totals.discount} />}
          <Row label="Tax" value={totals.tax} />
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>Total</span>
            <span>{formatMoney(totals.total)}</span>
          </div>
        </div>
      </div>

      <Button
        className="h-12 shrink-0 text-base"
        size="lg"
        disabled={cart.length === 0 || totals.total <= 0}
        onClick={onCharge}
      >
        <IconReceipt className="size-5" /> Charge {formatMoney(totals.total)}
      </Button>
    </div>
  );
}
