"use client";

import { useMemo, useState } from "react";
import type { PaginationState } from "@tanstack/react-table";
import { IconPlus, IconSearch } from "@tabler/icons-react";

import { PageHeader } from "@/components/rbac/page-header";
import { PermissionPage } from "@/components/rbac/permission-page";
import { Can } from "@/components/permission-gate";
import { DataTableGeneric } from "@/components/data-table-generic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getFeeLedgerColumns } from "./columns";
import { GenerateFeeDialog } from "./generate-fee-dialog";
import { CollectFeeDialog } from "./collect-fee-dialog";
import { useStudentFeeLedger, useBatches } from "@/hooks/queries/use-training";
import { usePermissions } from "@/hooks/usePermissions";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import type { FeeLedgerRow, FeeLedgerStatus } from "@/types/training";

const STATUS_OPTIONS: { value: FeeLedgerStatus; label: string }[] = [
  { value: "PAID", label: "Paid" },
  { value: "PARTIAL", label: "Partial" },
  { value: "PENDING", label: "Pending" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "NO_FEE", label: "No fee yet" },
];

export function StudentFeesContent() {
  const { can } = usePermissions();
  const canCollect = can("billing.create");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [collecting, setCollecting] = useState<FeeLedgerRow | null>(null);

  const search = useDebounce(searchInput, 400);

  const params = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : (statusFilter as FeeLedgerStatus),
      batchId: batchFilter === "all" ? undefined : batchFilter,
      sortBy: "createdAt" as const,
      sortOrder: "desc" as const,
    }),
    [pagination, search, statusFilter, batchFilter],
  );

  const { data, isLoading, isError, error } = useStudentFeeLedger(params);
  const { data: batchesData } = useBatches({ page: 1, limit: 100, status: "ACTIVE" });
  const batches = batchesData?.data ?? [];

  const [generateOpen, setGenerateOpen] = useState(false);

  const resetToFirstPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

  const columns = useMemo(
    () => getFeeLedgerColumns({ onCollect: setCollecting, canCollect }),
    [canCollect],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Fees"
        description="What every enrolled student has been billed and paid. Fees are collected at admission or the POS — use “Generate fee” for an outstanding or extra charge."
      >
        <Can permission="student_fee.create">
          <Button onClick={() => setGenerateOpen(true)}>
            <IconPlus className="size-4" /> Generate fee
          </Button>
        </Can>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              resetToFirstPage();
            }}
            placeholder="Search by student name…"
            className="pl-9"
          />
        </div>

        <Select
          value={batchFilter}
          onValueChange={(v) => {
            setBatchFilter(v);
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All batches</SelectItem>
            {batches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {getApiErrorMessage(error, "Failed to load student fees")}
        </div>
      ) : isLoading && !data ? (
        <div className="grid min-h-[30vh] place-items-center">
          <Spinner className="size-8" />
        </div>
      ) : (
        <DataTableGeneric
          columns={columns}
          data={data?.data ?? []}
          manualPagination
          pageCount={data?.meta.pagination.totalPages ?? 0}
          totalItems={data?.meta.pagination.totalItems ?? 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          showColumnVisibility={false}
        />
      )}

      <GenerateFeeDialog open={generateOpen} onOpenChange={setGenerateOpen} />
      {collecting && (
        <CollectFeeDialog
          open={!!collecting}
          onOpenChange={(o) => !o && setCollecting(null)}
          enrollmentId={collecting.enrollmentId}
          studentName={collecting.studentName}
        />
      )}
    </div>
  );
}

export default function StudentFeesPage() {
  return (
    <PermissionPage permission="student_fee.view">
      <StudentFeesContent />
    </PermissionPage>
  );
}
