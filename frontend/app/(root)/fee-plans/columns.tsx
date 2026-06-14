"use client";

import { ColumnDef } from "@tanstack/react-table";
import { IconDotsVertical, IconEye, IconPencil, IconTrash } from "@tabler/icons-react";

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
import type { FeePlan } from "@/types/training";

interface ColumnHandlers {
  onView: (item: FeePlan) => void;
  onEdit: (item: FeePlan) => void;
  onDelete: (item: FeePlan) => void;
  can: (permission: string) => boolean;
}

export function getFeePlanColumns({
  onView,
  onEdit,
  onDelete,
  can,
}: ColumnHandlers): ColumnDef<FeePlan>[] {
  return [
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.program.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "durationType",
      header: "Duration type",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.durationType.charAt(0) + row.original.durationType.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      cell: ({ row }) => <span className="text-sm">{formatMoney(row.original.amount)}</span>,
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
                {can("fee_plan.update") && (
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <IconPencil className="size-4" /> Edit
                  </DropdownMenuItem>
                )}
                {can("fee_plan.delete") && (
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
