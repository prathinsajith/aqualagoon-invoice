"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ProductStatusBadge } from "@/components/rbac/product-status-badge";
import { DateText } from "@/components/date-text";
import { IconPhoto } from "@tabler/icons-react";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

const money = (value: number): string =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const resolveUrl = (url: string | null): string | undefined =>
  url ? (url.startsWith("http") ? url : `${env.apiUrl}${url}`) : undefined;

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-muted/30 px-3 py-2", className)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export function ProductViewDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const img = resolveUrl(product?.imageUrl ?? null);
  const lowStock = product ? product.stockQuantity <= product.minimumStock : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="truncate">{product?.name ?? "Product"}</DialogTitle>
          <DialogDescription>Inventory product details.</DialogDescription>
        </DialogHeader>

        {product && (
          <div className="space-y-5">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border bg-muted/30">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={product.name} className="size-full object-cover" />
                ) : (
                  <IconPhoto className="size-8 text-muted-foreground/40" />
                )}
              </div>
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <ProductStatusBadge status={product.status} />
                  {product.deletedAt && <Badge variant="destructive">Archived</Badge>}
                  <Badge variant="secondary" className="font-normal">
                    {product.category.name}
                  </Badge>
                </div>
                <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Selling" value={money(product.sellingPrice)} />
              <Stat label="Purchase" value={money(product.purchasePrice)} />
              <Stat label="Tax" value={`${product.taxPercentage}%`} />
            </div>

            {/* Stock */}
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="In stock"
                value={
                  <span className={lowStock ? "text-amber-600 dark:text-amber-400" : ""}>
                    {product.stockQuantity}
                    {lowStock && " · low"}
                  </span>
                }
              />
              <Stat label="Minimum stock" value={product.minimumStock} />
            </div>

            {/* Details */}
            <Field label="Barcode" value={product.barcode || "—"} />

            <Field
              label="Description"
              value={
                <p className="rounded-lg bg-muted/40 p-3 text-sm font-normal text-foreground/90">
                  {product.description || "No description provided."}
                </p>
              }
            />

            {/* Audit timestamps — always last */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4">
              <Field label="Created" value={<DateText value={product.createdAt} withTime />} />
              <Field
                label="Last updated"
                value={<DateText value={product.updatedAt} withTime />}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
