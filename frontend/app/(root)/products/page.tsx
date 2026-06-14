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
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getProductColumns } from "./columns";
import { ProductFormDialog } from "./product-form-dialog";
import { ProductViewDialog } from "./product-view-dialog";
import { useProducts, useProductMutations } from "@/hooks/queries/use-products";
import { useProductCategories } from "@/hooks/queries/use-product-categories";
import { usePermissions } from "@/hooks/usePermissions";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Product, ProductStatus } from "@/types/product";

export function ProductsContent() {
  const { can } = usePermissions();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "name">("createdAt");
  const [showArchived, setShowArchived] = useState(false);

  const search = useDebounce(searchInput, 400);

  const params = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : (statusFilter as ProductStatus),
      categoryId: categoryFilter === "all" ? undefined : categoryFilter,
      onlyDeleted: showArchived || undefined,
      sortBy,
      sortOrder: sortBy === "name" ? ("asc" as const) : ("desc" as const),
    }),
    [pagination, search, statusFilter, categoryFilter, showArchived, sortBy],
  );

  const { data, isLoading, isError, error } = useProducts(params);
  const { data: categoriesData } = useProductCategories({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const { remove, restore } = useProductMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [pendingAction, setPendingAction] = useState<{ product: Product; type: "delete" | "restore" } | null>(null);

  const resetToFirstPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

  const columns = useMemo(
    () =>
      getProductColumns({
        can,
        onView: setViewing,
        onEdit: (p) => {
          setEditing(p);
          setFormOpen(true);
        },
        onDelete: (p) => setPendingAction({ product: p, type: "delete" }),
        onRestore: (p) => setPendingAction({ product: p, type: "restore" }),
      }),
    [can],
  );

  const confirmAction = async () => {
    if (!pendingAction) return;
    const { product, type } = pendingAction;
    try {
      if (type === "delete") {
        await remove.mutateAsync(product.id);
        toast.success("Product archived");
      } else {
        await restore.mutateAsync(product.id);
        toast.success("Product restored");
      }
      setPendingAction(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const categories = categoriesData?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description="Manage sellable inventory items.">
        <Can permission="product.create">
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <IconPlus className="size-4" /> New product
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
            placeholder="Search name, SKU, barcode…"
            className="pl-9"
          />
        </div>

        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
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
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "createdAt" | "name")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Newest first</SelectItem>
            <SelectItem value="name">Name (A–Z)</SelectItem>
          </SelectContent>
        </Select>

        <label htmlFor="show-archived" className="flex items-center gap-2 text-sm">
          <Checkbox
            id="show-archived"
            checked={showArchived}
            onCheckedChange={(v) => {
              setShowArchived(!!v);
              resetToFirstPage();
            }}
          />
          Show archived
        </label>
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {getApiErrorMessage(error, "Failed to load products")}
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
          onRowClick={setViewing}
          showColumnVisibility={false}
        />
      )}

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} />
      <ProductViewDialog
        product={viewing}
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
      />
      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={(o) => !o && setPendingAction(null)}
        title={pendingAction?.type === "delete" ? "Archive product?" : "Restore product?"}
        description={
          pendingAction?.type === "delete"
            ? "The product will be soft-deleted and can be restored later."
            : "The product will be reactivated and appear in the catalog again."
        }
        confirmLabel={pendingAction?.type === "delete" ? "Archive" : "Restore"}
        destructive={pendingAction?.type === "delete"}
        loading={remove.isPending || restore.isPending}
        onConfirm={confirmAction}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <PermissionPage permission="product.view">
      <ProductsContent />
    </PermissionPage>
  );
}
