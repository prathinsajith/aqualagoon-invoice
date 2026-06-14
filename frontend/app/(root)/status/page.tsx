"use client";

import React, { useEffect, useState } from "react";
import { StatusService } from "@/services/status-service";
import { DataTableGeneric } from "@/components/data-table-generic";
import { statusColumns, Status } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PaginationState } from "@tanstack/react-table";

export default function StatusPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  // Pagination State
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        setIsLoading(true);

        // Calculate page number (1-indexed for API)
        const page = pagination.pageIndex + 1;
        const limit = pagination.pageSize;

        // Use service layer for clean API interaction
        const result = await StatusService.getAll(page, limit);

        const calculatedPageCount = result.meta?.pagination?.totalPages ?? -1;
        const calculatedTotalItems = result.meta?.pagination?.totalItems ?? 0;



        setStatuses(result.data);
        setPageCount(calculatedPageCount);
        setTotalItems(calculatedTotalItems);
        setError(null);
      } catch (err) {
        console.error("Error fetching statuses:", err);
        setError(err instanceof Error ? err.message : "Failed to load statuses.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatuses();
  }, [pagination.pageIndex, pagination.pageSize]); // Refetch when pagination changes

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Header Section */}
      <div className="px-4 lg:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Status Management
          </h1>
        </div>

        <Link href="/status/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Status
          </Button>
        </Link>
      </div>

      {/* Data Display Section */}
      <div className="px-4 lg:px-6">
        {error ? (
          <div className="text-center py-10 text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <DataTableGeneric
            loading={isLoading}
            columns={statusColumns}
            data={statuses}
            searchKey="label"
            searchPlaceholder="Search statuses..."
            showColumnVisibility={true}
            showPagination={true}
            pageSize={pagination.pageSize}

            // Server-side pagination props
            manualPagination={true}
            pageCount={pageCount}
            totalItems={totalItems}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        )}
      </div>
    </div>
  );
}
