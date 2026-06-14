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
import { cn } from "@/lib/utils";
import type { TrainingType } from "@/types/training";

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

export function TrainingTypeViewDialog({
  trainingType,
  open,
  onOpenChange,
}: {
  trainingType: TrainingType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <DialogTitle className="truncate">{trainingType?.name ?? "Training type"}</DialogTitle>
            {trainingType && <ProductStatusBadge status={trainingType.status} />}
          </div>
          <DialogDescription>Training type details.</DialogDescription>
        </DialogHeader>

        {trainingType && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Programs" value={trainingType.programsCount} />
            </div>

            <Field
              label="Description"
              value={
                <p className="rounded-lg bg-muted/40 p-3 text-sm font-normal text-foreground/90">
                  {trainingType.description || "No description provided."}
                </p>
              }
            />

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4">
              <Field label="Created" value={<DateText value={trainingType.createdAt} withTime />} />
              <Field
                label="Last updated"
                value={<DateText value={trainingType.updatedAt} withTime />}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
