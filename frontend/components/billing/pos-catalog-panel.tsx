"use client";

import Image from "next/image";
import { useMemo } from "react";
import {
  IconSearch,
  IconPhoto,
  IconTicket,
  IconSchool,
  IconShoppingBag,
} from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { isPass, isTraining, lineKey, resolveImg } from "./pos-utils";
import type { CatalogItem } from "@/types/billing";

/** A single tappable catalog tile (product, pass, or training fee). */
function CatalogCard({ item, onAdd }: { item: CatalogItem; onAdd: (item: CatalogItem) => void }) {
  const pass = isPass(item);
  const training = isTraining(item);
  const out = !pass && !training && (item.stockQuantity ?? 0) <= 0;
  const img = resolveImg(item.imageUrl);

  return (
    <button
      type="button"
      disabled={out}
      onClick={() => onAdd(item)}
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
          training ? "bg-emerald-50 dark:bg-emerald-950/30" : pass ? "bg-primary/5" : "bg-muted/40",
        )}
      >
        {img ? (
          <Image
            src={img}
            alt={item.name}
            fill
            unoptimized
            sizes="150px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center">
            {training ? (
              <IconSchool className="size-9 text-emerald-500/50" />
            ) : pass ? (
              <IconTicket className="size-9 text-primary/40" />
            ) : (
              <IconPhoto className="size-8 text-muted-foreground/30" />
            )}
          </div>
        )}
        <span
          className={cn(
            "absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur",
            training
              ? "bg-emerald-500/90 text-white"
              : pass
                ? "bg-primary/90 text-primary-foreground"
                : out
                  ? "bg-destructive/90 text-white"
                  : "bg-background/80 text-muted-foreground",
          )}
        >
          {training ? "Fee" : pass ? "Pass" : out ? "Out" : `${item.stockQuantity} left`}
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
}

/** A labelled group of catalog tiles. */
function CatalogSection({
  icon: Icon,
  label,
  items,
  onAdd,
}: {
  icon: typeof IconShoppingBag;
  label: string;
  items: CatalogItem[];
  onAdd: (item: CatalogItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-0.5">
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
        <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground tabular-nums">
          {items.length}
        </span>
        <div className="ml-1 h-px flex-1 bg-border/60" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] content-start gap-3">
        {items.map((item) => (
          <CatalogCard key={lineKey(item)} item={item} onAdd={onAdd} />
        ))}
      </div>
    </section>
  );
}

/**
 * Searchable catalog grouped into Training fees / Passes / Products. Training
 * fees only appear once a customer is selected (they're per-student).
 */
export function PosCatalogPanel({
  searchInput,
  onSearch,
  loading,
  items,
  onAdd,
}: {
  searchInput: string;
  onSearch: (value: string) => void;
  loading: boolean;
  items: CatalogItem[];
  onAdd: (item: CatalogItem) => void;
}) {
  const groups = useMemo(
    () => ({
      training: items.filter(isTraining),
      passes: items.filter(isPass),
      products: items.filter((i) => i.itemType === "PRODUCT"),
    }),
    [items],
  );

  return (
    <div className="flex min-h-0 flex-col gap-4 lg:col-span-3">
      <div className="shrink-0 space-y-1.5">
        <Label>Catalog</Label>
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            autoFocus
            value={searchInput}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search products or passes…"
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid flex-1 place-items-center">
          <Spinner className="size-7" />
        </div>
      ) : items.length === 0 ? (
        <div className="grid flex-1 place-items-center rounded-xl border border-dashed text-sm text-muted-foreground">
          Nothing found
        </div>
      ) : (
        <div className="-mx-1 flex-1 space-y-5 overflow-y-auto px-1">
          <CatalogSection icon={IconSchool} label="Training fees" items={groups.training} onAdd={onAdd} />
          <CatalogSection icon={IconTicket} label="Passes" items={groups.passes} onAdd={onAdd} />
          <CatalogSection icon={IconShoppingBag} label="Products" items={groups.products} onAdd={onAdd} />
        </div>
      )}
    </div>
  );
}
