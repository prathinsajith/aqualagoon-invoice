"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MediaImage } from "@/components/ui/media-image";
import {
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconArchive,
  IconRestore,
  IconPhoto,
} from "@tabler/icons-react";

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
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

interface ColumnHandlers {
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onRestore: (product: Product) => void;
  can: (permission: string) => boolean;
}

const resolveUrl = (url: string | null): string | undefined =>
  url ? (url.startsWith("http") ? url : `${env.apiUrl}${url}`) : undefined;

const money = (value: number): string =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function getProductColumns({
  onView,
  onEdit,
  onDelete,
  onRestore,
  can,
}: ColumnHandlers): ColumnDef<Product>[] {
  return [
    {
      id: "name",
      header: "Product",
      cell: ({ row }) => {
        const p = row.original;
        const img = resolveUrl(p.imageUrl);
        return (
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted/30">
              {img ? (
                <MediaImage src={img} alt={p.name} width={40} height={40} className="size-full object-cover" />
              ) : (
                <IconPhoto className="size-4 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{p.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-normal">
          {row.original.category.name}
        </Badge>
      ),
    },
    {
      id: "price",
      header: "Price",
      cell: ({ row }) => <span className="text-sm tabular-nums">{money(row.original.sellingPrice)}</span>,
    },
    {
      id: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const p = row.original;
        const low = p.stockQuantity <= p.minimumStock;
        return (
          <span
            className={cn(
              "text-sm tabular-nums",
              low ? "font-medium text-amber-600 dark:text-amber-400" : "",
            )}
            title={low ? `At or below minimum (${p.minimumStock})` : undefined}
          >
            {p.stockQuantity}
            {low && " ⚠"}
          </span>
        );
      },
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
        const product = row.original;
        const isArchived = !!product.deletedAt;
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
                <DropdownMenuItem onClick={() => onView(product)}>
                  <IconEye className="size-4" /> View
                </DropdownMenuItem>
                {can("product.update") && !isArchived && (
                  <DropdownMenuItem onClick={() => onEdit(product)}>
                    <IconPencil className="size-4" /> Edit
                  </DropdownMenuItem>
                )}
                {can("product.update") && isArchived && (
                  <DropdownMenuItem onClick={() => onRestore(product)}>
                    <IconRestore className="size-4" /> Restore
                  </DropdownMenuItem>
                )}
                {can("product.delete") && !isArchived && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(product)}>
                      <IconArchive className="size-4" /> Archive
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
