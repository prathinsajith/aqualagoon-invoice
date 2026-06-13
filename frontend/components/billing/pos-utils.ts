import { env } from "@/lib/env";
import type { CatalogItem } from "@/types/billing";
import type { ManagedUser } from "@/types/rbac";

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const isPass = (item: CatalogItem) => item.itemType === "PASS";
/** A student pass is an individual membership — only ever one per sale. */
export const isSingleQtyPass = (item: CatalogItem) =>
  isPass(item) && item.passKind === "STUDENT";
/** Stable cart-line identity for a catalog item (type + id). */
export const lineKey = (item: CatalogItem) => `${item.itemType}:${item.id}`;

/** Resolves a (possibly relative) image URL against the API base. */
export const resolveImg = (url: string | null): string | undefined =>
  url ? (url.startsWith("http") ? url : `${env.apiUrl}${url}`) : undefined;

export interface CartLine {
  item: CatalogItem;
  quantity: number;
  discountAmount: number;
}

/** The in-progress sale: customer, captured pass holder, and payment inputs. */
export interface SaleState {
  customer: ManagedUser | null;
  holderName: string;
  paymentMethodId: string;
  paidAmount: number | undefined;
  payOpen: boolean;
}

export const INITIAL_SALE: SaleState = {
  customer: null,
  holderName: "",
  paymentMethodId: "",
  paidAmount: undefined,
  payOpen: false,
};

export interface CartTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export function lineTotals(line: CartLine) {
  const gross = round2(line.item.price * line.quantity);
  // Passes carry no per-line discount and no tax (price is the net catalog price).
  const discount = isPass(line.item) ? 0 : Math.min(line.discountAmount, gross);
  const taxable = gross - discount;
  const tax = round2((taxable * line.item.taxPercentage) / 100);
  const total = round2(taxable + tax);
  return { gross, discount, tax, total };
}
