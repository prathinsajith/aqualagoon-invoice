"use client";

import { useMemo, useState } from "react";
import type { PaginationState } from "@tanstack/react-table";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";

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

import { RefreshButton } from "@/components/refresh-button";
import { getEnrollmentColumns } from "./columns";
import { EnrollDialog } from "./enroll-dialog";
import { useEnrollments, useEnrollmentMutations, useBatches } from "@/hooks/queries/use-training";
import { usePermissions } from "@/hooks/usePermissions";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import type { EnrollmentStatus, StudentEnrollment } from "@/types/training";

const STATUS_OPTIONS: EnrollmentStatus[] = ["ACTIVE", "COMPLETED", "DROPPED", "PAUSED"];
const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
  PAUSED: "Paused",
};

export function EnrollmentsContent() {
  const { can } = usePermissions();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");

  const search = useDebounce(searchInput, 400);

  const params = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : (statusFilter as EnrollmentStatus),
      batchId: batchFilter === "all" ? undefined : batchFilter,
      sortBy: "createdAt" as const,
      sortOrder: "desc" as const,
    }),
    [pagination, search, statusFilter, batchFilter],
  );

  const { data, isLoading, isError, error } = useEnrollments(params);
  const { update } = useEnrollmentMutations();

  const { data: batchesData } = useBatches({ page: 1, limit: 100, status: "ACTIVE" });
  const batches = batchesData?.data ?? [];

  const [enrollOpen, setEnrollOpen] = useState(false);

  const resetToFirstPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

  const changeStatus = async (enrollment: StudentEnrollment, status: EnrollmentStatus) => {
    try {
      await update.mutateAsync({ id: enrollment.id, payload: { status } });
      toast.success("Enrollment updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update enrollment"));
    }
  };

  const columns = useMemo(
    () =>
      getEnrollmentColumns({
        onChangeStatus: changeStatus,
        canUpdate: can("enrollment.update"),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [can],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Enrollments" description="Students enrolled in training batches.">
        <Can permission="enrollment.create">
          <Button onClick={() => setEnrollOpen(true)}>
            <IconPlus className="size-4" /> Enroll student
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
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
                {b.name} — {b.program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <RefreshButton queryKey={["enrollments"]} className="sm:ml-auto" />
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {getApiErrorMessage(error, "Failed to load enrollments")}
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

      <EnrollDialog open={enrollOpen} onOpenChange={setEnrollOpen} />
    </div>
  );
}

export default function EnrollmentsPage() {
  return (
    <PermissionPage permission="enrollment.view">
      <EnrollmentsContent />
    </PermissionPage>
  );
}
