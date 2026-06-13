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
import type { ProductCategory } from "@/types/product";

interface ColumnHandlers {
  onView: (category: ProductCategory) => void;
  onEdit: (category: ProductCategory) => void;
  onDelete: (category: ProductCategory) => void;
  can: (permission: string) => boolean;
}

const formatDate = (value: string | null): string =>
  value ? new Date(value).toLocaleDateString() : "—";

export function getCategoryColumns({
  onView,
  onEdit,
  onDelete,
  can,
}: ColumnHandlers): ColumnDef<ProductCategory>[] {
  return [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.code}</span>
      ),
    },
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          {row.original.description && (
            <span className="line-clamp-1 text-xs text-muted-foreground">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "products",
      header: "Products",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-normal">
          {row.original.productsCount}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => {
        const category = row.original;
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
                <DropdownMenuItem onClick={() => onView(category)}>
                  <IconEye className="size-4" /> View
                </DropdownMenuItem>
                {can("product_category.update") && (
                  <DropdownMenuItem onClick={() => onEdit(category)}>
                    <IconPencil className="size-4" /> Edit
                  </DropdownMenuItem>
                )}
                {can("product_category.delete") && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(category)}>
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
