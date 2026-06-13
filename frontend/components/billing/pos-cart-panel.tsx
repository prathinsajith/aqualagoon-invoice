"use client";

import {
  IconMinus,
  IconPlus,
  IconReceipt,
  IconShoppingCart,
  IconTicket,
  IconTrash,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { CustomerSelect } from "@/components/billing/customer-select";
import { formatMoney } from "@/lib/format";
import { isPass, isSingleQtyPass, lineKey, lineTotals } from "./pos-utils";
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
        <Label>Customer</Label>
        <CustomerSelect value={customer} onChange={onCustomer} />
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
              const single = isSingleQtyPass(line.item);
              return (
                <div key={key} className="space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {pass && <IconTicket className="size-3.5 shrink-0 text-primary" />}
                        {line.item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(line.item.price)}
                        {pass ? " · pass" : ` · ${line.item.taxPercentage}% tax`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(key)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <IconTrash className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center rounded-md border">
                      <button
                        type="button"
                        className="grid size-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                        disabled={single}
                        onClick={() => onQty(key, line.quantity - 1)}
                      >
                        <IconMinus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
                      <button
                        type="button"
                        className="grid size-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                        disabled={single || (!pass && line.quantity >= (line.item.stockQuantity ?? 1))}
                        onClick={() => onQty(key, line.quantity + 1)}
                      >
                        <IconPlus className="size-3.5" />
                      </button>
                    </div>
                    {!pass && (
                      <div className="flex items-center gap-1.5">
                        <Label className="text-[11px] text-muted-foreground">Disc</Label>
                        <NumberInput
                          value={line.discountAmount}
                          onChange={(v) => onDiscount(key, v ?? 0)}
                          min={0}
                          decimals
                          hideSteppers
                          placeholder="0"
                          className="h-8 w-20"
                        />
                      </div>
                    )}
                    <span className="w-20 text-right text-sm font-semibold">{formatMoney(t.total)}</span>
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
