"use client";

import { ColumnDef } from "@tanstack/react-table";
import { IconDotsVertical, IconEye } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PassStatusBadge } from "@/components/passes/pass-status-badge";
import { DateText } from "@/components/date-text";
import { PASS_KIND_LABELS } from "@/lib/pass-format";
import type { UserPass } from "@/types/pass";

interface ColumnHandlers {
  onView: (pass: UserPass) => void;
}

export function getPassColumns({ onView }: ColumnHandlers): ColumnDef<UserPass>[] {
  return [
    {
      accessorKey: "passNumber",
      header: "Pass no.",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium">{row.original.passNumber}</span>
      ),
    },
    {
      id: "holder",
      header: "Holder",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.holderName ?? "Walk-in"}</span>
      ),
    },
    {
      id: "passType",
      header: "Pass type",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.passType.name}</span>
          <span className="text-xs text-muted-foreground">
            {PASS_KIND_LABELS[row.original.passType.type]}
          </span>
        </div>
      ),
    },
    {
      id: "entries",
      header: "Entries",
      cell: ({ row }) =>
        row.original.passType.entryType === "UNLIMITED" ? (
          <span className="text-sm text-muted-foreground">Unlimited</span>
        ) : (
          <span className="text-sm">{row.original.remainingEntries ?? 0} left</span>
        ),
    },
    {
      accessorKey: "expiryTime",
      header: "Expires",
      cell: ({ row }) => (
        <span className="text-sm">
          <DateText value={row.original.expiryTime} />
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <PassStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <IconDotsVertical className="size-4" />
                <span className="sr-only">Open actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(row.original)}>
                <IconEye className="size-4" /> View &amp; manage
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}
