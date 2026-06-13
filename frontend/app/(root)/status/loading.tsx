import React from "react"

export default function Loading() {
    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="px-4 lg:px-6 flex flex-col gap-2">
                <div className="h-8 w-64 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg animate-pulse" />
                <div className="h-4 w-96 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg animate-pulse" />
            </div>

            {/* Cards Skeleton */}
            <div className="px-4 lg:px-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="rounded-xl border bg-card p-6 shadow-sm"
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <div className="space-y-3">
                            <div className="h-4 w-24 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
                            <div className="h-8 w-32 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
                            <div className="h-3 w-20 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart Skeleton */}
            <div className="px-4 lg:px-6">
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="space-y-4">
                        <div className="h-6 w-48 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
                        <div className="h-64 w-full bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="px-4 lg:px-6 space-y-4">
                {/* Search Bar Skeleton */}
                <div className="flex items-center justify-between gap-4">
                    <div className="h-11 w-full max-w-md bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg animate-pulse" />
                    <div className="h-11 w-24 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg animate-pulse" />
                </div>

                {/* Table Card Skeleton */}
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-muted/40 px-8 py-4 border-b border-border/40">
                        <div className="flex gap-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="h-3 flex-1 bg-gradient-to-r from-muted-foreground/20 via-muted-foreground/10 to-muted-foreground/20 rounded animate-pulse"
                                    style={{ animationDelay: `${i * 50}ms` }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-border/40">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                            <div
                                key={row}
                                className="px-8 py-5"
                                style={{ animationDelay: `${row * 80}ms` }}
                            >
                                <div className="flex gap-4 items-center">
                                    <div className="h-4 w-4 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
                                    <div className="h-4 flex-1 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
                                    <div className="h-6 w-24 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-full animate-pulse" />
                                    <div className="h-6 w-20 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-full animate-pulse" />
                                    <div className="h-4 w-16 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
                                    <div className="h-4 w-16 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
                                    <div className="h-8 w-8 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-full animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pagination Skeleton */}
                <div className="flex items-center justify-between px-1">
                    <div className="h-4 w-32 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
                    <div className="flex items-center gap-4">
                        <div className="h-9 w-24 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
                        <div className="h-4 w-16 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse" />
                        <div className="flex gap-1">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="h-9 w-9 bg-gradient-to-r from-muted via-muted/60 to-muted rounded animate-pulse"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
