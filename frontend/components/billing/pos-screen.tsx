"use client";

import { useMemo, useReducer, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { usePaymentMethods } from "@/hooks/queries/use-payment-methods";
import { BillingService } from "@/services/billing-service";
import { PosCatalogPanel } from "@/components/billing/pos-catalog-panel";
import { PosCartPanel } from "@/components/billing/pos-cart-panel";
import { PosPaymentDialog } from "@/components/billing/pos-payment-dialog";
import { PosReceiptDialog, type CompletedSale } from "@/components/billing/pos-receipt-dialog";
import { printReceipt } from "@/lib/print-receipt";
import { printReceiptThermal, isThermalPrintingSupported } from "@/lib/thermal-printer";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import {
  INITIAL_SALE,
  isPass,
  isSingleQtyPass,
  lineKey,
  lineTotals,
  round2,
  type CartLine,
  type SaleState,
} from "@/components/billing/pos-utils";
import type { CatalogItem } from "@/types/billing";

/**
 * The POS UI (header-less). Used both as the /billing page and as a modal.
 * `fill` makes it fill its parent's height (modal); otherwise it sizes itself
 * to the viewport (standalone page). Presentation lives in the `Pos*` panels;
 * this component owns the cart/sale state and the checkout flow.
 */
export function PosScreen({
  onCompleted,
  fill = false,
}: {
  onCompleted?: () => void;
  fill?: boolean;
}) {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 350);
  const [cart, setCart] = useState<CartLine[]>([]);
  // The whole in-progress sale lives in one reducer — one update, one render.
  const [sale, patchSale] = useReducer(
    (state: SaleState, patch: Partial<SaleState>) => ({ ...state, ...patch }),
    INITIAL_SALE,
  );
  const { customer, holderName, paymentMethodId, paidAmount, payOpen } = sale;
  const [completed, setCompleted] = useState<CompletedSale | null>(null);

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ["billing", "catalog", search],
    queryFn: () => BillingService.catalog(search || undefined, 24),
    placeholderData: keepPreviousData,
  });
  const items = catalog ?? [];

  const { data: methodsData } = usePaymentMethods({ isActive: true, limit: 100 });
  const methods = methodsData?.data ?? [];
  // The effective method: the cashier's explicit choice, or the first active
  // one as a default — derived during render, so no effect/extra render.
  const selectedMethodId = paymentMethodId || methods[0]?.id || "";

  const addToCart = (item: CatalogItem) => {
    if (item.itemType === "PRODUCT" && (item.stockQuantity ?? 0) <= 0) {
      toast.error(`${item.name} is out of stock`);
      return;
    }
    setCart((prev) => {
      // Only one pass (type) may be sold per sale — its quantity can still grow.
      if (isPass(item)) {
        const otherPass = prev.find((l) => isPass(l.item) && lineKey(l.item) !== lineKey(item));
        if (otherPass) {
          toast.error("Only one pass per sale — remove the current pass to add a different one.");
          return prev;
        }
      }
      const existing = prev.find((l) => lineKey(l.item) === lineKey(item));
      if (existing) {
        // A student pass is a single membership — only one per sale.
        if (isSingleQtyPass(item)) {
          toast.info(`${item.name} is already in the cart`);
          return prev;
        }
        // Products are capped by stock; other passes can be bought in any quantity.
        if (item.itemType === "PRODUCT" && existing.quantity >= (item.stockQuantity ?? 0)) {
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
        // Student passes stay at 1; other passes have no stock cap; products are
        // clamped to available stock.
        if (isSingleQtyPass(l.item)) return { ...l, quantity: 1 };
        if (isPass(l.item)) return { ...l, quantity: Math.max(1, qty || 1) };
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

  const hasPassInCart = cart.some((l) => isPass(l.item));
  const paid = paidAmount ?? 0;
  const change = round2(Math.max(0, paid - totals.total));
  const canCheckout =
    cart.length > 0 && !!selectedMethodId && paid >= totals.total && totals.total > 0;

  const checkout = useMutation({
    mutationFn: async () => {
      const result = await BillingService.checkout({
        customerId: customer?.id ?? null,
        holderName: hasPassInCart ? holderName.trim() || null : null,
        items: cart.map((l) => ({
          itemType: l.item.itemType,
          id: l.item.id,
          quantity: l.quantity,
          discountAmount: isPass(l.item) ? 0 : l.discountAmount,
        })),
        payment: { paymentMethodId: selectedMethodId, paidAmount: paid },
      });
      const receipt = await BillingService.receipt(result.invoice.id);
      return { receipt, change: result.change, passes: result.passes };
    },
    onSuccess: (data) => {
      setCompleted(data);
      clearCart();
      // Reset the whole sale (close dialog, clear customer/holder/payment).
      patchSale({ payOpen: false, customer: null, holderName: "", paidAmount: undefined });
      // Stock (and pass counts) changed — refetch the catalog so the grid stays accurate.
      queryClient.invalidateQueries({ queryKey: ["billing", "catalog"] });
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

  const openPayment = () =>
    patchSale({
      // Default the paid amount to the exact total for a fast checkout.
      paidAmount: paidAmount && paidAmount > 0 ? paidAmount : totals.total,
      // Pre-fill the pass holder with the selected customer's name.
      holderName:
        hasPassInCart && customer
          ? holderName || `${customer.firstName} ${customer.lastName}`.trim()
          : holderName,
      payOpen: true,
    });

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 lg:grid-cols-5",
        fill ? "lg:h-full lg:min-h-0" : "lg:h-[calc(100dvh-12rem)]",
      )}
    >
      <PosCatalogPanel
        searchInput={searchInput}
        onSearch={setSearchInput}
        loading={catalogLoading && !catalog}
        items={items}
        onAdd={addToCart}
      />

      <PosCartPanel
        cart={cart}
        totals={totals}
        customer={customer}
        onCustomer={(c) => patchSale({ customer: c })}
        onClear={clearCart}
        onQty={setQty}
        onDiscount={setDiscount}
        onRemove={removeLine}
        onCharge={openPayment}
      />

      <PosPaymentDialog
        open={payOpen}
        onOpenChange={(o) => patchSale({ payOpen: o })}
        total={totals.total}
        cartCount={cart.length}
        methods={methods}
        selectedMethodId={selectedMethodId}
        onMethod={(id) => patchSale({ paymentMethodId: id })}
        hasPassInCart={hasPassInCart}
        holderName={holderName}
        onHolder={(name) => patchSale({ holderName: name })}
        paidAmount={paidAmount}
        onPaid={(v) => patchSale({ paidAmount: v })}
        change={change}
        paid={paid}
        canCheckout={canCheckout}
        pending={checkout.isPending}
        onConfirm={() => checkout.mutate()}
      />

      <PosReceiptDialog
        completed={completed}
        onClose={() => setCompleted(null)}
        onPrint={() => completed && printReceipt(completed.receipt)}
        onThermal={printThermal}
      />
    </div>
  );
}
