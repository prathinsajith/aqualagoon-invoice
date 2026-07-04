"use client";

import { useMemo, useState } from "react";
import type { PaginationState } from "@tanstack/react-table";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/rbac/page-header";
import { PermissionPage } from "@/components/rbac/permission-page";
import { ConfirmDialog } from "@/components/rbac/confirm-dialog";
import { Can } from "@/components/permission-gate";
import { DataTableGeneric } from "@/components/data-table-generic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { RefreshButton } from "@/components/refresh-button";
import { getTrainingProgramColumns } from "./columns";
import { TrainingProgramFormDialog } from "./training-program-form-dialog";
import { TrainingProgramViewDialog } from "./training-program-view-dialog";
import {
  useTrainingPrograms,
  useTrainingProgramMutations,
  useTrainingTypes,
} from "@/hooks/queries/use-training";
import { usePermissions } from "@/hooks/usePermissions";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import type { TrainingProgram } from "@/types/training";
import type { ProductStatus } from "@/types/product";

export function TrainingProgramsContent() {
  const { can } = usePermissions();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const search = useDebounce(searchInput, 400);

  const params = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : (statusFilter as ProductStatus),
      trainingTypeId: typeFilter === "all" ? undefined : typeFilter,
    }),
    [pagination, search, statusFilter, typeFilter],
  );

  const { data, isLoading, isError, error } = useTrainingPrograms(params);
  const { remove } = useTrainingProgramMutations();
  const { data: typesData } = useTrainingTypes({ page: 1, limit: 100, status: "ACTIVE" });
  const trainingTypes = typesData?.data ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingProgram | null>(null);
  const [viewing, setViewing] = useState<TrainingProgram | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TrainingProgram | null>(null);

  const resetToFirstPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

  const columns = useMemo(
    () =>
      getTrainingProgramColumns({
        can,
        onView: setViewing,
        onEdit: (c) => {
          setEditing(c);
          setFormOpen(true);
        },
        onDelete: (c) => setPendingDelete(c),
      }),
    [can],
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await remove.mutateAsync(pendingDelete.id);
      toast.success("Training program deleted");
      setPendingDelete(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Training Programs" description="Define programs within each training type.">
        <Can permission="training_program.create">
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <IconPlus className="size-4" /> New program
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
            placeholder="Search name…"
            className="pl-9"
          />
        </div>

        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Training type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All training types</SelectItem>
            {trainingTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
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
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <RefreshButton queryKey={["training-programs"]} className="sm:ml-auto" />
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {getApiErrorMessage(error, "Failed to load training programs")}
        </div>
      ) : (
        <DataTableGeneric
          loading={isLoading && !data}
          columns={columns}
          data={data?.data ?? []}
          manualPagination
          pageCount={data?.meta.pagination.totalPages ?? 0}
          totalItems={data?.meta.pagination.totalItems ?? 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          onRowClick={setViewing}
          showColumnVisibility={false}
        />
      )}

      <TrainingProgramFormDialog open={formOpen} onOpenChange={setFormOpen} program={editing} />
      <TrainingProgramViewDialog
        program={viewing}
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Delete training program?"
        description="The program will be archived. Programs with fee plans or batches can't be deleted."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default function TrainingProgramsPage() {
  return (
    <PermissionPage permission="training_program.view">
      <TrainingProgramsContent />
    </PermissionPage>
  );
}
