"use client";

import { useMemo, useState } from "react";
import type { PaginationState } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { IconSearch, IconShoppingCart } from "@tabler/icons-react";

import { PageHeader } from "@/components/rbac/page-header";
import { PermissionPage } from "@/components/rbac/permission-page";
import { Can } from "@/components/permission-gate";
import { DataTableGeneric } from "@/components/data-table-generic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getInvoiceColumns } from "./columns";
import { InvoiceViewDialog } from "./invoice-view-dialog";
import { PosScreen } from "@/components/billing/pos-screen";
import { useInvoices, invoiceKeys } from "@/hooks/queries/use-invoices";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import type { InvoiceStatus, InvoiceSummary } from "@/types/billing";

const STATUSES: InvoiceStatus[] = ["DRAFT", "PENDING", "PARTIAL", "PAID", "CANCELLED", "REFUNDED"];

function InvoicesContent() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const search = useDebounce(searchInput, 400);

  const params = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : (statusFilter as InvoiceStatus),
    }),
    [pagination, search, statusFilter],
  );

  const { data, isLoading, isError, error } = useInvoices(params);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [posOpen, setPosOpen] = useState(false);
  const qc = useQueryClient();

  const resetToFirstPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));
  const columns = useMemo(() => getInvoiceColumns(), []);

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Browse, view and reprint sales invoices.">
        <Can permission="billing.create">
          <Button onClick={() => setPosOpen(true)}>
            <IconShoppingCart className="size-4" /> New sale
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
            placeholder="Search invoice number…"
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
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {getApiErrorMessage(error, "Failed to load invoices")}
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
          onRowClick={(row: InvoiceSummary) => setViewingId(row.id)}
          showColumnVisibility={false}
        />
      )}

      <InvoiceViewDialog
        invoiceId={viewingId}
        open={!!viewingId}
        onOpenChange={(o) => !o && setViewingId(null)}
      />

      {/* Full-screen POS */}
      <Dialog open={posOpen} onOpenChange={setPosOpen}>
        <DialogContent
          showCloseButton
          className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none"
        >
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <IconShoppingCart className="size-5" /> New sale
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <PosScreen
              fill
              onCompleted={() => qc.invalidateQueries({ queryKey: invoiceKeys.all })}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <PermissionPage permission="invoice.view">
      <InvoicesContent />
    </PermissionPage>
  );
}
