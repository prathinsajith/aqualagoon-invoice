"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getContrastColor } from "@/lib/utils";

// Define the Status interface based on user's data
export interface Status {
    id: number;
    label: string;
    colorCode: string;
    createdAt?: string;
    updatedAt?: string;
}

export const statusColumns: ColumnDef<Status>[] = [
    {
        id: "index",
        header: "#",
        cell: ({ row }) => (
            <span className="text-muted-foreground font-medium">
                {row.index + 1}
            </span>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "label",
        header: "Status",
        cell: ({ row }) => {
            const status = row.original;
            const textColor = getContrastColor(status.colorCode);

            return (
                <div className="flex items-center gap-3">

                    {/* Status Label */}
                    <div className="flex flex-col">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-foreground" style={{ backgroundColor: status.colorCode, color: textColor }}>
                            {status.label}
                        </span>
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: "colorCode",
        header: "Color",
        cell: ({ row }) => {
            const colorCode = row.original.colorCode;
            return (
                <div className="flex items-center gap-2">
                    <div
                        className="w-4 h-4 rounded border border-border"
                        style={{ backgroundColor: colorCode }}
                    />
                </div>
            );
        },
    },
    {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => {
            const date = row.original.updatedAt;
            if (!date) return <span className="text-sm text-muted-foreground">-</span>;
            return (
                <span className="text-sm text-muted-foreground">
                    {new Date(date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </span>
            );
        },
    },
    {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: () => {
            return (
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                    </Button>
                </div>
            );
        },
    },
];
