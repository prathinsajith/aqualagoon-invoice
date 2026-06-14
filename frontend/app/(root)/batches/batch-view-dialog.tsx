"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateText } from "@/components/date-text";
import { cn } from "@/lib/utils";
import { BatchStatusBadge } from "./columns";
import type { TrainingBatch } from "@/types/training";

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

const schedule = (start: string | null, end: string | null): string => {
  if (!start && !end) return "Not scheduled";
  return `${start ?? "—"}–${end ?? "—"}`;
};

export function BatchViewDialog({
  batch,
  open,
  onOpenChange,
}: {
  batch: TrainingBatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <DialogTitle className="truncate">{batch?.name ?? "Batch"}</DialogTitle>
            {batch && <BatchStatusBadge status={batch.status} />}
          </div>
          <DialogDescription>Training batch details.</DialogDescription>
        </DialogHeader>

        {batch && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Program" value={batch.program.name} />
              <Field label="Trainer" value={batch.trainerName ?? "Unassigned"} />
              <Field label="Schedule" value={schedule(batch.startTime, batch.endTime)} />
              <Field
                label="Capacity"
                value={`${batch.currentStrength} / ${batch.capacity}`}
              />
              <Field
                label="Start date"
                value={batch.startDate ? <DateText value={batch.startDate} /> : "—"}
              />
              <Field
                label="End date"
                value={batch.endDate ? <DateText value={batch.endDate} /> : "—"}
              />
              <Field label="Enrollments" value={batch.enrollmentsCount} />
              <Field label="Current strength" value={batch.currentStrength} />
            </div>

            {/* Audit timestamps — always last */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4">
              <Field label="Created" value={<DateText value={batch.createdAt} withTime />} />
              <Field
                label="Last updated"
                value={<DateText value={batch.updatedAt} withTime />}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
