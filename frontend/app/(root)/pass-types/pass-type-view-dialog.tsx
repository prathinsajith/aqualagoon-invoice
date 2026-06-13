"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductStatusBadge } from "@/components/rbac/product-status-badge";
import { DateText } from "@/components/date-text";
import { formatMoney } from "@/lib/format";
import { PASS_KIND_LABELS, formatDuration, formatEntries } from "@/lib/pass-format";
import { cn } from "@/lib/utils";
import type { PassType } from "@/types/pass";

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function discountLabel(passType: PassType): string {
  if (passType.discountType === "NONE" || passType.discountValue <= 0) return "None";
  return passType.discountType === "PERCENTAGE"
    ? `${passType.discountValue}%`
    : formatMoney(passType.discountValue);
}

export function PassTypeViewDialog({
  passType,
  open,
  onOpenChange,
}: {
  passType: PassType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <DialogTitle className="truncate">{passType?.name ?? "Pass type"}</DialogTitle>
            {passType && <ProductStatusBadge status={passType.status} />}
          </div>
          <DialogDescription>
            {passType ? PASS_KIND_LABELS[passType.type] : "Pass"} pass details.
          </DialogDescription>
        </DialogHeader>

        {passType && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field
                label="Validity"
                value={formatDuration(passType.durationType, passType.durationValue)}
              />
              <Field
                label="Entries"
                value={formatEntries(passType.entryType, passType.allowedEntries)}
              />
              <Field
                label="Max / day"
                value={passType.maxEntriesPerDay != null ? passType.maxEntriesPerDay : "No limit"}
              />
              <Field label="Passes issued" value={passType.passesCount} />
              <Field label="Price" value={formatMoney(passType.price)} />
              <Field label="Discount" value={discountLabel(passType)} />
            </div>

            <Field
              label="Description"
              value={
                <p className="rounded-lg bg-muted/40 p-3 text-sm font-normal text-foreground/90">
                  {passType.description || "No description provided."}
                </p>
              }
            />

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4">
              <Field label="Created" value={<DateText value={passType.createdAt} withTime />} />
              <Field label="Last updated" value={<DateText value={passType.updatedAt} withTime />} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
