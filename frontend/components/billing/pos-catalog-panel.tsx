"use client";

import Image from "next/image";
import { IconSearch, IconPhoto, IconTicket } from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { isPass, lineKey, resolveImg } from "./pos-utils";
import type { CatalogItem } from "@/types/billing";

/** Searchable grid of sellable products and passes for the POS. */
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
  return (
    <div className="flex min-h-0 flex-col gap-4 lg:col-span-3">
      <div className="shrink-0 space-y-1.5">
        <Label>Products &amp; passes</Label>
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
                      pass ? "bg-primary/5" : "bg-muted/40",
                    )}
                  >
                    {img ? (
                      // Catalog images come from arbitrary backend/external hosts at
                      // runtime, so `unoptimized` skips the Next optimizer (the browser
                      // fetches directly) — no remote-pattern config, no broken images.
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
  );
}
