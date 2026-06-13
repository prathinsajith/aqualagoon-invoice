"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { InvoiceStatusBadge } from "@/components/billing/invoice-status-badge";
import { formatMoney } from "@/lib/format";
import type { InvoiceSummary } from "@/types/billing";

const formatDateTime = (value: string): string => new Date(value).toLocaleString();

export function getInvoiceColumns(): ColumnDef<InvoiceSummary>[] {
  return [
    {
      accessorKey: "invoiceNo",
      header: "Invoice",
      cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.original.invoiceNo}</span>,
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-normal">
          {row.original.invoiceType}
        </Badge>
      ),
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => <span className="text-sm">{row.original.itemCount}</span>,
    },
    {
      id: "total",
      header: "Total",
      cell: ({ row }) => (
        <span className="text-sm font-semibold tabular-nums">
          {formatMoney(row.original.totalAmount)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
      ),
    },
  ];
}
