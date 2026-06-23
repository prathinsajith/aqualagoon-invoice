"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    PaginationState,
    OnChangeFn,
} from "@tanstack/react-table"
import {
    IconChevronDown,
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconLayoutColumns,
    IconSearch,
    IconArrowUp,
    IconArrowDown,
    IconSelector,
    IconGripVertical,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    /** Show shimmer rows instead of data — for the first load of this table. */
    loading?: boolean
    searchKey?: string
    searchPlaceholder?: string
    showColumnVisibility?: boolean
    showPagination?: boolean
    pageSize?: number
    pageSizeOptions?: number[]
    pageCount?: number
    totalItems?: number
    manualPagination?: boolean
    pagination?: PaginationState
    onPaginationChange?: OnChangeFn<PaginationState>
    onRowClick?: (row: TData) => void
    /** When set, rows become drag-reorderable; receives the new ordering on drop. */
    onReorder?: (items: TData[]) => void
}

export function DataTableGeneric<TData, TValue>({
    columns,
    data,
    loading = false,
    searchKey,
    searchPlaceholder = "Search...",
    showColumnVisibility = true,
    showPagination = true,
    pageSize = 10,
    pageSizeOptions = [10, 20, 30, 40, 50],
    pageCount,
    totalItems,
    manualPagination = false,
    pagination: externalPagination,
    onPaginationChange,
    onRowClick,
    onReorder,
}: DataTableProps<TData, TValue>) {
    const dragFrom = React.useRef<number | null>(null)
    const [dragOver, setDragOver] = React.useState<number | null>(null)
    const handleDrop = (to: number) => {
        const from = dragFrom.current
        dragFrom.current = null
        setDragOver(null)
        if (from === null || from === to || !onReorder) return
        const next = [...data]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        onReorder(next)
    }
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: pageSize,
    })

    const pagination = externalPagination ?? internalPagination
    const setPagination = onPaginationChange ?? setInternalPagination

    const table = useReactTable({
        data,
        columns,
        pageCount: manualPagination ? pageCount : undefined,
        manualPagination: manualPagination,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })

    const { pageIndex, pageSize: currentPageSize } = table.getState().pagination
    const totalCount = manualPagination && totalItems !== undefined ? totalItems : table.getFilteredRowModel().rows.length
    const start = totalCount === 0 ? 0 : (pageIndex * currentPageSize) + 1
    const end = Math.min((pageIndex + 1) * currentPageSize, totalCount)

    return (
        <div className="w-full space-y-3">
            {/* Premium Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
                {/* Search */}
                {searchKey && (
                    <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:max-w-md">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                                onChange={(event) =>
                                    table.getColumn(searchKey)?.setFilterValue(event.target.value)
                                }
                                className="pl-9 h-9 bg-background border-border/40 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all"
                            />
                        </div>
                    </div>
                )}

                {/* Column Visibility */}
                {showColumnVisibility && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 h-9 px-3 shadow-sm border-border/40 hover:bg-accent/50 transition-all">
                                <IconLayoutColumns className="size-4" />
                                <span className="hidden sm:inline font-medium">View</span>
                                <IconChevronDown className="size-3.5 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="max-h-[60vh] w-56 max-w-[calc(100vw-1rem)] overflow-y-auto">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Premium Table Card */}
            <div className="table-container metronic-card">
                <Table>
                    <TableHeader className="table-header">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border">
                                {onReorder && <TableHead className="w-8 pl-4" />}
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className="h-9 text-[11px] font-bold text-muted-foreground uppercase tracking-wider first:pl-4 last:pr-4"
                                        >
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={
                                                        header.column.getCanSort()
                                                            ? "flex items-center gap-2 cursor-pointer select-none group transition-colors hover:text-foreground/90"
                                                            : ""
                                                    }
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    // Keyboard-operable sort: focusable + Enter/Space toggles.
                                                    role={header.column.getCanSort() ? "button" : undefined}
                                                    tabIndex={header.column.getCanSort() ? 0 : undefined}
                                                    aria-sort={
                                                        header.column.getIsSorted() === "asc"
                                                            ? "ascending"
                                                            : header.column.getIsSorted() === "desc"
                                                                ? "descending"
                                                                : header.column.getCanSort()
                                                                    ? "none"
                                                                    : undefined
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (!header.column.getCanSort()) return;
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            header.column.toggleSorting();
                                                        }
                                                    }}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {header.column.getCanSort() && (
                                                        <div className="flex items-center ml-1">
                                                            {header.column.getIsSorted() === "asc" ? (
                                                                <IconArrowUp className="size-3.5 text-primary" />
                                                            ) : header.column.getIsSorted() === "desc" ? (
                                                                <IconArrowDown className="size-3.5 text-primary" />
                                                            ) : (
                                                                <IconSelector className="size-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: Math.min(currentPageSize, 8) }).map((_, r) => (
                                <TableRow key={`skeleton-${r}`} className="hover:bg-transparent">
                                    {onReorder && <TableCell className="w-8 pl-4" />}
                                    {columns.map((_, c) => (
                                        <TableCell key={c} className="py-3 px-4 first:pl-4 last:pr-4">
                                            <Skeleton className={cn("h-4", c === 0 ? "w-32" : "w-20")} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    onClick={() => onRowClick?.(row.original)}
                                    className={cn(
                                        "table-row group",
                                        onRowClick && "cursor-pointer",
                                        // Highlight the row the dragged item will drop onto.
                                        dragOver === row.index && "border-t-2 border-t-primary",
                                    )}
                                    draggable={onReorder ? true : undefined}
                                    onDragStart={
                                        onReorder
                                            ? (e) => {
                                                dragFrom.current = row.index
                                                // Required for the drag to start in Firefox/Safari.
                                                e.dataTransfer.setData("text/plain", String(row.index))
                                                e.dataTransfer.effectAllowed = "move"
                                            }
                                            : undefined
                                    }
                                    onDragOver={
                                        onReorder
                                            ? (e) => {
                                                e.preventDefault()
                                                e.dataTransfer.dropEffect = "move"
                                                if (dragOver !== row.index) setDragOver(row.index)
                                            }
                                            : undefined
                                    }
                                    onDragEnd={onReorder ? () => { dragFrom.current = null; setDragOver(null) } : undefined}
                                    onDrop={onReorder ? () => handleDrop(row.index) : undefined}
                                >
                                    {onReorder && (
                                        <TableCell className="w-8 pl-4 text-muted-foreground/50">
                                            <IconGripVertical className="size-4 cursor-grab active:cursor-grabbing" />
                                        </TableCell>
                                    )}
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-2 px-4 first:pl-4 last:pr-4">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow className="border-0 hover:bg-transparent">
                                <TableCell
                                    colSpan={columns.length + (onReorder ? 1 : 0)}
                                    className="h-32 text-center text-muted-foreground"
                                >
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="size-12 rounded-full bg-muted/40 flex items-center justify-center">
                                            <IconSearch className="size-5 text-muted-foreground/40" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-foreground/80">No results found</p>
                                            <p className="text-xs text-muted-foreground/60">Try adjusting your search or filters</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Premium Pagination */}
            {showPagination && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
                    <div className="text-muted-foreground hidden flex-1 text-sm lg:flex items-center gap-2">
                        {table.getFilteredSelectedRowModel().rows.length > 0 ? (
                            <div className="flex items-center gap-2.5 text-sm font-medium">
                                <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-foreground/70">
                                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                                    {manualPagination && totalItems ? totalItems : table.getFilteredRowModel().rows.length} selected
                                </span>
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground/60">
                                {start} - {end} of {totalCount} results
                            </span>
                        )}
                    </div>
                    <div className="flex w-full sm:w-auto items-center gap-4 justify-between sm:justify-end">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="rows-per-page" className="text-xs font-medium text-muted-foreground/70 whitespace-nowrap">
                                Rows
                            </Label>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value))
                                }}
                            >
                                <SelectTrigger size="sm" className="w-16 h-8 shadow-sm border-border/40" id="rows-per-page">
                                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {pageSizeOptions.map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/70">
                            <span className="text-foreground/80">{table.getState().pagination.pageIndex + 1}</span>
                            <span>/</span>
                            <span>{table.getPageCount()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex shadow-sm border-border/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to first page</span>
                                <IconChevronsLeft className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0 shadow-sm border-border/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <IconChevronLeft className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0 shadow-sm border-border/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to next page</span>
                                <IconChevronRight className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex shadow-sm border-border/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to last page</span>
                                <IconChevronsRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
