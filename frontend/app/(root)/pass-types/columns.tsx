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
import { PASS_KIND_LABELS, formatDuration, formatEntries } from "@/lib/pass-format";
import type { PassType } from "@/types/pass";

interface ColumnHandlers {
  onView: (passType: PassType) => void;
  onEdit: (passType: PassType) => void;
  onDelete: (passType: PassType) => void;
  can: (permission: string) => boolean;
}

export function getPassTypeColumns({
  onView,
  onEdit,
  onDelete,
  can,
}: ColumnHandlers): ColumnDef<PassType>[] {
  return [
    {
      id: "name",
      header: "Pass type",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">
            {PASS_KIND_LABELS[row.original.type]}
          </span>
        </div>
      ),
    },
    {
      id: "validity",
      header: "Validity",
      cell: ({ row }) => (
        <span className="text-sm">
          {formatDuration(row.original.durationType, row.original.durationValue)}
        </span>
      ),
    },
    {
      id: "entries",
      header: "Entries",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatEntries(row.original.entryType, row.original.allowedEntries)}
        </span>
      ),
    },
    {
      id: "price",
      header: "Price",
      cell: ({ row }) => {
        const { price, discountType, discountValue } = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{formatMoney(price)}</span>
            {discountType !== "NONE" && discountValue > 0 && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                −{discountType === "PERCENTAGE" ? `${discountValue}%` : formatMoney(discountValue)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "issued",
      header: "Issued",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-normal">
          {row.original.passesCount}
        </Badge>
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
        const passType = row.original;
        const canDelete = can("pass_type.delete") && passType.passesCount === 0;
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
                <DropdownMenuItem onClick={() => onView(passType)}>
                  <IconEye className="size-4" /> View
                </DropdownMenuItem>
                {can("pass_type.update") && (
                  <DropdownMenuItem onClick={() => onEdit(passType)}>
                    <IconPencil className="size-4" /> Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(passType)}>
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
