"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  IconSearch,
  IconPlus,
  IconMinus,
  IconTrash,
  IconShoppingCart,
  IconReceipt,
  IconPrinter,
  IconBluetooth,
  IconPhoto,
  IconTicket,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { NumberInput } from "@/components/ui/number-input";
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

import { usePaymentMethods } from "@/hooks/queries/use-payment-methods";
import { BillingService } from "@/services/billing-service";
import { ReceiptView } from "@/components/billing/receipt-view";
import { CustomerSelect } from "@/components/billing/customer-select";
import { printReceipt } from "@/lib/print-receipt";
import { printReceiptThermal, isThermalPrintingSupported } from "@/lib/thermal-printer";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

const resolveImg = (url: string | null): string | undefined =>
  url ? (url.startsWith("http") ? url : `${env.apiUrl}${url}`) : undefined;
import type { CatalogItem, IssuedPass, Receipt } from "@/types/billing";
import type { ManagedUser } from "@/types/rbac";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const isPass = (item: CatalogItem) => item.itemType === "PASS";

interface CartLine {
  item: CatalogItem;
  quantity: number;
  discountAmount: number;
}

function lineTotals(line: CartLine) {
  const gross = round2(line.item.price * line.quantity);
  // Passes carry no per-line discount and no tax (price is the net catalog price).
  const discount = isPass(line.item) ? 0 : Math.min(line.discountAmount, gross);
  const taxable = gross - discount;
  const tax = round2((taxable * line.item.taxPercentage) / 100);
  const total = round2(taxable + tax);
  return { gross, discount, tax, total };
}

/**
 * The POS UI (header-less). Used both as the /billing page and as a modal.
 * `fill` makes it fill its parent's height (modal); otherwise it sizes itself
 * to the viewport (standalone page).
 */
export function PosScreen({
  onCompleted,
  fill = false,
}: {
  onCompleted?: () => void;
  fill?: boolean;
}) {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 350);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState<ManagedUser | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paidAmount, setPaidAmount] = useState<number | undefined>(undefined);
  const [payOpen, setPayOpen] = useState(false);
  const [completed, setCompleted] = useState<{
    receipt: Receipt;
    change: number;
    passes: IssuedPass[];
  } | null>(null);

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ["billing", "catalog", search],
    queryFn: () => BillingService.catalog(search || undefined, 24),
    placeholderData: keepPreviousData,
  });
  const items = catalog ?? [];

  const { data: methodsData } = usePaymentMethods({ isActive: true, limit: 100 });
  const methods = methodsData?.data ?? [];

  // Default to the first active payment method once they load.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!paymentMethodId && methods.length > 0) setPaymentMethodId(methods[0]!.id);
  }, [methods, paymentMethodId]);

  const lineKey = (item: CatalogItem) => `${item.itemType}:${item.id}`;

  const addToCart = (item: CatalogItem) => {
    if (item.itemType === "PRODUCT" && (item.stockQuantity ?? 0) <= 0) {
      toast.error(`${item.name} is out of stock`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => lineKey(l.item) === lineKey(item));
      if (existing) {
        // A pass is a single membership — only one per sale.
        if (isPass(item)) {
          toast.info(`${item.name} is already in the cart`);
          return prev;
        }
        if (existing.quantity >= (item.stockQuantity ?? 0)) {
          toast.error(`Only ${item.stockQuantity} in stock`);
          return prev;
        }
        return prev.map((l) =>
          lineKey(l.item) === lineKey(item) ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { item, quantity: 1, discountAmount: 0 }];
    });
  };

  const setQty = (key: string, qty: number) =>
    setCart((prev) =>
      prev.map((l) => {
        if (lineKey(l.item) !== key) return l;
        // Passes are always quantity 1.
        if (isPass(l.item)) return l;
        const max = l.item.stockQuantity ?? 1;
        return { ...l, quantity: Math.max(1, Math.min(qty || 1, max)) };
      }),
    );

  const setDiscount = (key: string, amount: number) =>
    setCart((prev) =>
      prev.map((l) => (lineKey(l.item) === key ? { ...l, discountAmount: Math.max(0, amount || 0) } : l)),
    );

  const removeLine = (key: string) => setCart((prev) => prev.filter((l) => lineKey(l.item) !== key));
  const clearCart = () => setCart([]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    for (const line of cart) {
      const t = lineTotals(line);
      subtotal += t.gross;
      discount += t.discount;
      tax += t.tax;
    }
    subtotal = round2(subtotal);
    discount = round2(discount);
    tax = round2(tax);
    return { subtotal, discount, tax, total: round2(subtotal - discount + tax) };
  }, [cart]);

  const paid = paidAmount ?? 0;
  const change = round2(Math.max(0, paid - totals.total));
  const canCheckout =
    cart.length > 0 && !!paymentMethodId && paid >= totals.total && totals.total > 0;

  const checkout = useMutation({
    mutationFn: async () => {
      const result = await BillingService.checkout({
        customerId: customer?.id ?? null,
        items: cart.map((l) => ({
          itemType: l.item.itemType,
          id: l.item.id,
          quantity: l.quantity,
          discountAmount: isPass(l.item) ? 0 : l.discountAmount,
        })),
        payment: { paymentMethodId, paidAmount: paid },
      });
      const receipt = await BillingService.receipt(result.invoice.id);
      return { receipt, change: result.change, passes: result.passes };
    },
    onSuccess: (data) => {
      setCompleted(data);
      setPayOpen(false);
      clearCart();
      setCustomer(null);
      setPaidAmount(undefined);
      toast.success(`Invoice ${data.receipt.invoiceNo} created`);
      onCompleted?.();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const printThermal = async () => {
    if (!completed) return;
    if (!isThermalPrintingSupported()) {
      toast.error(
        "Bluetooth printing needs Chrome/Edge or Android Chrome. On iPhone/iPad use “Print” instead.",
      );
      return;
    }
    try {
      await printReceiptThermal(completed.receipt);
      toast.success("Sent to printer");
    } catch (err) {
      // User dismissing the device chooser isn't an error worth shouting about.
      if (err instanceof DOMException && (err.name === "NotFoundError" || err.name === "AbortError")) {
        return;
      }
      toast.error(err instanceof Error ? err.message : "Could not print");
    }
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 lg:grid-cols-5",
        fill ? "lg:h-full lg:min-h-0" : "lg:h-[calc(100dvh-12rem)]",
      )}
    >
      {/* Catalog search + grid (scrolls independently) */}
      <div className="flex min-h-0 flex-col gap-4 lg:col-span-3">
        <div className="shrink-0 space-y-1.5">
          <Label>Products &amp; passes</Label>
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              autoFocus
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products or passes…"
              className="pl-9"
            />
          </div>
        </div>

        {catalogLoading && !catalog ? (
          <div className="grid flex-1 place-items-center">
            <Spinner className="size-7" />
          </div>
        ) : items.length === 0 ? (
          <div className="grid flex-1 place-items-center rounded-xl border border-dashed text-sm text-muted-foreground">
            Nothing found
          </div>
        ) : (
          <div className="-mx-1 flex-1 overflow-y-auto px-1">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] content-start gap-3">
              {items.map((item) => {
                const pass = isPass(item);
                const out = !pass && (item.stockQuantity ?? 0) <= 0;
                const img = resolveImg(item.imageUrl);
                return (
                  <button
                    key={lineKey(item)}
                    type="button"
                    disabled={out}
                    onClick={() => addToCart(item)}
                    className={cn(
                      "group flex h-full flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-all",
                      out
                        ? "cursor-not-allowed opacity-50"
                        : "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:translate-y-0",
                    )}
                  >
                    <div
                      className={cn(
                        "relative aspect-square w-full overflow-hidden",
                        pass ? "bg-primary/5" : "bg-muted/40",
                      )}
                    >
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={item.name}
                          className="size-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid size-full place-items-center">
                          {pass ? (
                            <IconTicket className="size-9 text-primary/40" />
                          ) : (
                            <IconPhoto className="size-8 text-muted-foreground/30" />
                          )}
                        </div>
                      )}
                      <span
                        className={cn(
                          "absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur",
                          pass
                            ? "bg-primary/90 text-primary-foreground"
                            : out
                              ? "bg-destructive/90 text-white"
                              : "bg-background/80 text-muted-foreground",
                        )}
                      >
                        {pass ? "Pass" : out ? "Out" : `${item.stockQuantity} left`}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-2.5">
                      <span className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug">
                        {item.name}
                      </span>
                      <div className="mt-auto flex items-end justify-between pt-1.5">
                        <span className="text-base font-bold">{formatMoney(item.price)}</span>
                        <span className="line-clamp-1 font-mono text-[10px] text-muted-foreground">
                          {item.sku ?? item.subtitle}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cart + payment rail (cart scrolls, payment stays pinned) */}
      <div className="flex min-h-0 flex-col gap-4 lg:col-span-2">
        <div className="shrink-0 space-y-1.5">
          <Label>Customer</Label>
          <CustomerSelect value={customer} onChange={setCustomer} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2 font-semibold">
              <IconShoppingCart className="size-4" /> Cart ({cart.length})
            </div>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
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
                        onClick={() => removeLine(key)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <IconTrash className="size-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {pass ? (
                        <span className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground">
                          Qty 1
                        </span>
                      ) : (
                        <div className="flex items-center rounded-md border">
                          <button
                            type="button"
                            className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
                            onClick={() => setQty(key, line.quantity - 1)}
                          >
                            <IconMinus className="size-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
                          <button
                            type="button"
                            className="grid size-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                            disabled={line.quantity >= (line.item.stockQuantity ?? 1)}
                            onClick={() => setQty(key, line.quantity + 1)}
                          >
                            <IconPlus className="size-3.5" />
                          </button>
                        </div>
                      )}
                      {!pass && (
                        <div className="flex items-center gap-1.5">
                          <Label className="text-[11px] text-muted-foreground">Disc</Label>
                          <NumberInput
                            value={line.discountAmount}
                            onChange={(v) => setDiscount(key, v ?? 0)}
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
          onClick={() => {
            // Default the paid amount to the exact total for a fast checkout.
            setPaidAmount((prev) => (prev && prev > 0 ? prev : totals.total));
            setPayOpen(true);
          }}
        >
          <IconReceipt className="size-5" /> Charge {formatMoney(totals.total)}
        </Button>
      </div>

      {/* Payment dialog — opened after the order is confirmed */}
      <Dialog open={payOpen} onOpenChange={(o) => !o && setPayOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Take payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl bg-muted/40 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Amount due</p>
              <p className="text-3xl font-bold tracking-tight">{formatMoney(totals.total)}</p>
              <p className="text-xs text-muted-foreground">{cart.length} item(s)</p>
            </div>

            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="paid">Paid amount</Label>
                <NumberInput id="paid" value={paidAmount} onChange={setPaidAmount} min={0} decimals />
              </div>
              <div className="space-y-1.5">
                <Label>Change</Label>
                <div className="flex h-10 items-center rounded-lg border bg-muted/30 px-3 text-sm font-semibold">
                  {formatMoney(change)}
                </div>
              </div>
            </div>

            {paid > 0 && paid < totals.total && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Full payment required — {formatMoney(totals.total - paid)} short.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Back to cart
            </Button>
            <Button disabled={!canCheckout || checkout.isPending} onClick={() => checkout.mutate()}>
              {checkout.isPending ? (
                <Spinner />
              ) : (
                <>
                  <IconReceipt className="size-4" /> Confirm {formatMoney(totals.total)}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt dialog */}
      <Dialog open={!!completed} onOpenChange={(o) => !o && setCompleted(null)}>
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
                  <div className="space-y-1">
                    {completed.passes.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="truncate">{p.passTypeName}</span>
                        <span className="font-mono text-xs font-medium">{p.passNumber}</span>
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
            <Button variant="outline" onClick={() => setCompleted(null)}>
              New sale
            </Button>
            {completed && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => printReceipt(completed.receipt)}>
                  <IconPrinter className="size-4" /> Print
                </Button>
                <Button onClick={printThermal}>
                  <IconBluetooth className="size-4" /> Thermal printer
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
