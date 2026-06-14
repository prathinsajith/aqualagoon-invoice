"use client";

import { ColumnDef } from "@tanstack/react-table";
import { IconDotsVertical, IconEye, IconPencil, IconTrash } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { BatchStatus, TrainingBatch } from "@/types/training";

interface ColumnHandlers {
  onView: (batch: TrainingBatch) => void;
  onEdit: (batch: TrainingBatch) => void;
  onDelete: (batch: TrainingBatch) => void;
  can: (permission: string) => boolean;
}

const STATUS_STYLES: Record<BatchStatus, string> = {
  ACTIVE: "border-transparent bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  COMPLETED: "border-transparent bg-muted text-muted-foreground",
  CANCELLED: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  return (
    <Badge className={cn("font-medium capitalize", STATUS_STYLES[status])}>
      {status.toLowerCase()}
    </Badge>
  );
}

const schedule = (start: string | null, end: string | null): string => {
  if (!start && !end) return "—";
  return `${start ?? "—"}–${end ?? "—"}`;
};

export function getBatchColumns({
  onView,
  onEdit,
  onDelete,
  can,
}: ColumnHandlers): ColumnDef<TrainingBatch>[] {
  return [
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="line-clamp-1 text-xs text-muted-foreground">
            {row.original.program.name}
          </span>
        </div>
      ),
    },
    {
      id: "trainer",
      header: "Trainer",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.trainerName ?? "Unassigned"}</span>
      ),
    },
    {
      id: "schedule",
      header: "Schedule",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {schedule(row.original.startTime, row.original.endTime)}
        </span>
      ),
    },
    {
      id: "capacity",
      header: "Capacity",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {row.original.currentStrength} / {row.original.capacity}
        </span>
      ),
    },
    {
      id: "enrollments",
      header: "Enrollments",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-normal">
          {row.original.enrollmentsCount}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <BatchStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => {
        const batch = row.original;
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <IconDotsVertical className="size-4" />
                  <span className="sr-only">Open actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(batch)}>
                  <IconEye className="size-4" /> View
                </DropdownMenuItem>
                {can("batch.update") && (
                  <DropdownMenuItem onClick={() => onEdit(batch)}>
                    <IconPencil className="size-4" /> Edit
                  </DropdownMenuItem>
                )}
                {can("batch.delete") && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(batch)}>
                      <IconTrash className="size-4" /> Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
