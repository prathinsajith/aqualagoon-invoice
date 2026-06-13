"use client";

import { IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/types/product";

const OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

/**
 * Segmented button toggle for ACTIVE / INACTIVE status — a button-style
 * checkbox (the selected option shows a check). Replaces a plain dropdown so
 * the binary choice is a single tap.
 */
export function StatusToggle({
  value,
  onChange,
  disabled,
}: {
  value: ProductStatus;
  onChange: (value: ProductStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex w-full gap-1 rounded-md bg-muted/40 p-1 sm:w-auto">
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
              selected
                ? option.value === "ACTIVE"
                  ? "bg-emerald-100 text-emerald-700 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-gray-200 text-gray-700 shadow-sm dark:bg-gray-700 dark:text-gray-200"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {selected && <IconCheck className="size-3.5" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
