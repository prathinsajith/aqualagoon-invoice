"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconDotsVertical, IconCircleCheckFilled, IconClock, IconCircleDashed } from "@tabler/icons-react"

// Define your data type
export type DashboardItem = {
    id: number
    header: string
    type: string
    status: string
    target: string
    limit: string
    reviewer: string
}

// Define your columns
export const dashboardColumns: ColumnDef<DashboardItem>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="border-gray-400"
                />
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="border-gray-400"
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "header",
        header: "Header",
        cell: ({ row }) => (
            <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {row.getValue("header")}
            </div>
        ),
        enableSorting: true,
    },
    {
        accessorKey: "type",
        header: "Section Type",
        cell: ({ row }) => (
            <Badge
                variant="outline"
                className="text-xs font-medium px-2.5 py-0.5 bg-blue-50/50 text-blue-700 border-blue-200 hover:bg-blue-100/50 transition-colors"
            >
                {row.getValue("type")}
            </Badge>
        ),
        enableSorting: true,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <div className="flex items-center gap-2">
                    {status === "Done" ? (
                        <>
                            <IconCircleCheckFilled className="size-4 text-green-600" />
                            <Badge
                                variant="secondary"
                                className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 border font-semibold shadow-sm"
                            >
                                Done
                            </Badge>
                        </>
                    ) : status === "In Process" ? (
                        <>
                            <IconClock className="size-4 text-blue-600" />
                            <Badge
                                variant="secondary"
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 border font-semibold shadow-sm"
                            >
                                In Process
                            </Badge>
                        </>
                    ) : (
                        <>
                            <IconCircleDashed className="size-4 text-gray-500" />
                            <Badge
                                variant="secondary"
                                className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 border font-semibold shadow-sm"
                            >
                                {status}
                            </Badge>
                        </>
                    )}
                </div>
            )
        },
        enableSorting: true,
    },
    {
        accessorKey: "target",
        header: () => <div className="text-right">Target</div>,
        cell: ({ row }) => (
            <div className="text-right">
                <span className="inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-md bg-primary/5 text-primary font-semibold text-sm border border-primary/10">
                    {row.getValue("target")}
                </span>
            </div>
        ),
        enableSorting: true,
    },
    {
        accessorKey: "limit",
        header: () => <div className="text-right">Limit</div>,
        cell: ({ row }) => (
            <div className="text-right">
                <span className="inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 font-semibold text-sm border border-orange-200">
                    {row.getValue("limit")}
                </span>
            </div>
        ),
        enableSorting: true,
    },
    {
        accessorKey: "reviewer",
        header: "Reviewer",
        cell: ({ row }) => {
            const reviewer = row.getValue("reviewer") as string
            const isAssigned = reviewer !== "Assign reviewer"

            return (
                <div className="flex items-center gap-2">
                    {isAssigned ? (
                        <>
                            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                                {reviewer.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <span className="font-medium text-sm">{reviewer}</span>
                        </>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                        >
                            {reviewer}
                        </Button>
                    )}
                </div>
            )
        },
        enableSorting: true,
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const item = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="data-[state=open]:bg-muted text-muted-foreground hover:text-foreground flex size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            size="icon"
                        >
                            <IconDotsVertical className="size-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => console.log("Edit", item)}>
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log("Copy", item)}>
                            Make a copy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log("Favorite", item)}>
                            Favorite
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => console.log("Delete", item)}
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
        enableSorting: false,
        enableHiding: false,
    },
]
