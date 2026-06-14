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
import { ProductStatusBadge } from "@/components/rbac/product-status-badge";
import { formatMoney } from "@/lib/format";
import type { TrainingProgram } from "@/types/training";

interface ColumnHandlers {
  onView: (item: TrainingProgram) => void;
  onEdit: (item: TrainingProgram) => void;
  onDelete: (item: TrainingProgram) => void;
  can: (permission: string) => boolean;
}

export function getTrainingProgramColumns({
  onView,
  onEdit,
  onDelete,
  can,
}: ColumnHandlers): ColumnDef<TrainingProgram>[] {
  return [
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.trainingType.name}</span>
        </div>
      ),
    },
    {
      id: "duration",
      header: "Duration",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.durationValue} {row.original.durationType.toLowerCase()}
          {row.original.durationValue > 1 ? "s" : ""}
        </span>
      ),
    },
    {
      id: "defaultFee",
      header: "Default fee",
      cell: ({ row }) => <span className="text-sm">{formatMoney(row.original.defaultFee)}</span>,
    },
    {
      id: "counts",
      header: "Plans / Batches",
      cell: ({ row }) => (
        <div className="flex gap-1.5">
          <Badge variant="secondary" className="font-normal">
            {row.original.feePlansCount} plans
          </Badge>
          <Badge variant="secondary" className="font-normal">
            {row.original.batchesCount} batches
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;
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
                <DropdownMenuItem onClick={() => onView(item)}>
                  <IconEye className="size-4" /> View
                </DropdownMenuItem>
                {can("training_program.update") && (
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <IconPencil className="size-4" /> Edit
                  </DropdownMenuItem>
                )}
                {can("training_program.delete") && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(item)}>
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
