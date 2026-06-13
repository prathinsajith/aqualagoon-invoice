"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { StatusToggle } from "@/components/ui/status-toggle";

import { categoryFormSchema, CategoryFormSchema } from "@/schemas/product";
import { useCategoryMutations } from "@/hooks/queries/use-product-categories";
import { getApiErrorMessage } from "@/lib/api-error";
import type { ProductCategory } from "@/types/product";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ProductCategory | null;
}

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const isEdit = !!category;
  const { create, update } = useCategoryMutations();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormSchema>({
    resolver: zodResolver(categoryFormSchema),
    mode: "onTouched",
    defaultValues: { name: "", description: "", status: "ACTIVE" },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: category?.name ?? "",
      description: category?.description ?? "",
      status: category?.status ?? "ACTIVE",
    });
  }, [open, category, reset]);

  const status = watch("status");

  const onSubmit = async (values: CategoryFormSchema) => {
    const payload = {
      name: values.name,
      description: values.description || null,
      status: values.status,
    };
    try {
      if (isEdit && category) {
        await update.mutateAsync({ id: category.id, payload });
        toast.success("Category updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Category created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "Create category"}</DialogTitle>
          <DialogDescription>
            Categories group inventory products (e.g. Drinks, Swim Gear).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. Drinks" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="What goes in this category?"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <StatusToggle value={status} onChange={(v) => setValue("status", v)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : isEdit ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
