"use client";

import { ColumnDef } from "@tanstack/react-table";
import { IconCash, IconHistory } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FeeLedgerRow, FeeLedgerStatus } from "@/types/training";

const STATUS_STYLES: Record<FeeLedgerStatus, string> = {
  PAID: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  PARTIAL: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  PENDING: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  OVERDUE: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  NO_FEE: "border-transparent bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<FeeLedgerStatus, string> = {
  PAID: "Paid",
  PARTIAL: "Partial",
  PENDING: "Pending",
  OVERDUE: "Overdue",
  NO_FEE: "No fee",
};

function FeeLedgerStatusBadge({ status }: { status: FeeLedgerStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function getFeeLedgerColumns({
  onCollect,
  onHistory,
  canCollect,
}: {
  onCollect: (row: FeeLedgerRow) => void;
  onHistory: (row: FeeLedgerRow) => void;
  canCollect: boolean;
}): ColumnDef<FeeLedgerRow>[] {
  return [
    {
      id: "student",
      header: "Student",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.studentName}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.programName} · {row.original.batchName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "billed",
      header: "Billed",
      cell: ({ row }) => <span className="text-sm tabular-nums">{formatMoney(row.original.billed)}</span>,
    },
    {
      accessorKey: "paid",
      header: "Paid",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-emerald-600 dark:text-emerald-400">
          {formatMoney(row.original.paid)}
        </span>
      ),
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => {
        const owes = row.original.balance > 0;
        return (
          <span className={cn("font-semibold tabular-nums", owes && "text-red-600 dark:text-red-400")}>
            {formatMoney(row.original.balance)}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <FeeLedgerStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableHiding: false,
      cell: ({ row }) => {
        const owes = row.original.balance > 0;
        const hasPaid = row.original.paid > 0;
        return (
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {hasPaid && (
              <Button size="sm" variant="ghost" onClick={() => onHistory(row.original)}>
                <IconHistory className="size-4" /> History
              </Button>
            )}
            {canCollect && owes && (
              <Button size="sm" variant="outline" onClick={() => onCollect(row.original)}>
                <IconCash className="size-4" /> Collect
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}
