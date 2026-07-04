"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconPhoto, IconTrash, IconUpload } from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusToggle } from "@/components/ui/status-toggle";
import { ImageCropperDialog } from "@/components/ui/image-cropper-dialog";

import { productFormSchema, ProductFormSchema } from "@/schemas/product";
import { useProductMutations, productKeys } from "@/hooks/queries/use-products";
import { useProductCategories } from "@/hooks/queries/use-product-categories";
import { ProductService } from "@/services/product-service";
import { getApiErrorMessage } from "@/lib/api-error";
import { env } from "@/lib/env";
import type { Product } from "@/types/product";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

const resolveUrl = (url: string | null): string | undefined =>
  url ? (url.startsWith("http") ? url : `${env.apiUrl}${url}`) : undefined;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const isEdit = !!product;
  const qc = useQueryClient();
  const { create, update } = useProductMutations();
  const { data: categoriesData } = useProductCategories(
    { page: 1, limit: 100, sortBy: "name", sortOrder: "asc" },
    { enabled: open },
  );
  const categories = categoriesData?.data ?? [];

  // Image state: a staged (cropped) file overrides the existing image; the
  // remove flag clears an existing image. Both are applied after the save.
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      categoryId: "",
      barcode: "",
      description: "",
      purchasePrice: 0,
      sellingPrice: 0,
      taxPercentage: 0,
      stockQuantity: 0,
      minimumStock: 0,
      status: "ACTIVE",
    },
  });

  // Clear staged image state the moment the dialog opens — done during render
  // with a prev-prop comparison (not an effect) so there's no extra commit
  // showing stale values. See react.dev "adjusting some state when a prop changes".
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setImageFile(null);
      setImagePreview(null);
      setRemoveImage(false);
    }
  }

  // Hydrate the form fields from the product when the dialog opens.
  useEffect(() => {
    if (!open) return;
    reset({
      name: product?.name ?? "",
      categoryId: product?.categoryId ?? "",
      barcode: product?.barcode ?? "",
      description: product?.description ?? "",
      purchasePrice: product?.purchasePrice ?? 0,
      sellingPrice: product?.sellingPrice ?? 0,
      taxPercentage: product?.taxPercentage ?? 0,
      stockQuantity: product?.stockQuantity ?? 0,
      minimumStock: product?.minimumStock ?? 0,
      status: product?.status ?? "ACTIVE",
    });
  }, [open, product, reset]);

  const categoryId = watch("categoryId");
  const status = watch("status");

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Please choose a JPG, PNG or WEBP image");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image exceeds the 5 MB limit");
      return;
    }
    setCropSrc(URL.createObjectURL(file));
  };

  const onCropped = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
    setCropSrc(null);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const currentPreview =
    imagePreview ?? (!removeImage ? resolveUrl(product?.imageUrl ?? null) : undefined);

  const onSubmit = async (values: ProductFormSchema) => {
    const payload = {
      name: values.name,
      categoryId: values.categoryId,
      barcode: values.barcode ? values.barcode : null,
      description: values.description || null,
      // Optional numerics default to 0 when left blank.
      purchasePrice: values.purchasePrice ?? 0,
      sellingPrice: values.sellingPrice,
      taxPercentage: values.taxPercentage ?? 0,
      stockQuantity: values.stockQuantity ?? 0,
      minimumStock: values.minimumStock ?? 0,
      status: values.status,
    };
    try {
      const saved =
        isEdit && product
          ? await update.mutateAsync({ id: product.id, payload })
          : await create.mutateAsync(payload);

      // Apply image changes against the saved product.
      if (imageFile) {
        await ProductService.uploadImage(saved.id, imageFile);
      } else if (removeImage && product?.imageUrl) {
        await ProductService.deleteImage(saved.id);
      }
      qc.invalidateQueries({ queryKey: productKeys.all });

      toast.success(isEdit ? "Product updated" : "Product created");
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit product" : "Create product"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update this inventory item's details."
                : "Add a new inventory item. The SKU is generated automatically."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Image */}
            <div className="flex items-center gap-4">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted/30">
                {currentPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentPreview} alt="Product" className="size-full object-cover" />
                ) : (
                  <IconPhoto className="size-7 text-muted-foreground/50" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  aria-label="Upload product image"
                  onChange={onPickFile}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                    <IconUpload className="size-4" /> {currentPreview ? "Replace" : "Upload"}
                  </Button>
                  {currentPreview && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearImage}>
                      <IconTrash className="size-4" /> Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG or WEBP — max 5 MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="e.g. Swimming Goggles" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="categoryId">Category</Label>
                <Select value={categoryId} onValueChange={(v) => setValue("categoryId", v, { shouldValidate: true })}>
                  <SelectTrigger id="categoryId" className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        No categories — create one first.
                      </div>
                    )}
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-xs text-destructive">{errors.categoryId.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="barcode">Barcode</Label>
                <Input id="barcode" placeholder="Optional" {...register("barcode")} />
                {errors.barcode && (
                  <p className="text-xs text-destructive">{errors.barcode.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sellingPrice">Selling price</Label>
                <Controller
                  control={control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <NumberInput
                      id="sellingPrice"
                      decimals
                      min={0}
                      step={1}
                      value={field.value}
                      onChange={field.onChange}
                      invalid={!!errors.sellingPrice}
                    />
                  )}
                />
                {errors.sellingPrice && (
                  <p className="text-xs text-destructive">{errors.sellingPrice.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="purchasePrice">Purchase price</Label>
                <Controller
                  control={control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <NumberInput
                      id="purchasePrice"
                      decimals
                      min={0}
                      step={1}
                      value={field.value}
                      onChange={field.onChange}
                      invalid={!!errors.purchasePrice}
                    />
                  )}
                />
                {errors.purchasePrice && (
                  <p className="text-xs text-destructive">{errors.purchasePrice.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="taxPercentage">Tax %</Label>
                <Controller
                  control={control}
                  name="taxPercentage"
                  render={({ field }) => (
                    <NumberInput
                      id="taxPercentage"
                      decimals
                      min={0}
                      max={100}
                      step={1}
                      value={field.value}
                      onChange={field.onChange}
                      invalid={!!errors.taxPercentage}
                    />
                  )}
                />
                {errors.taxPercentage && (
                  <p className="text-xs text-destructive">{errors.taxPercentage.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <StatusToggle value={status} onChange={(v) => setValue("status", v)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stockQuantity">Stock quantity</Label>
                <Controller
                  control={control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <NumberInput
                      id="stockQuantity"
                      min={0}
                      step={1}
                      value={field.value}
                      onChange={field.onChange}
                      invalid={!!errors.stockQuantity}
                    />
                  )}
                />
                {errors.stockQuantity && (
                  <p className="text-xs text-destructive">{errors.stockQuantity.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minimumStock">Minimum stock</Label>
                <Controller
                  control={control}
                  name="minimumStock"
                  render={({ field }) => (
                    <NumberInput
                      id="minimumStock"
                      min={0}
                      step={1}
                      value={field.value}
                      onChange={field.onChange}
                      invalid={!!errors.minimumStock}
                    />
                  )}
                />
                {errors.minimumStock && (
                  <p className="text-xs text-destructive">{errors.minimumStock.message}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">
                  Description <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea id="description" rows={3} placeholder="Optional product details" {...register("description")} />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner /> : isEdit ? "Save changes" : "Create product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImageCropperDialog
        open={!!cropSrc}
        onOpenChange={(o) => !o && setCropSrc(null)}
        src={cropSrc}
        onCropped={onCropped}
      />
    </>
  );
}
