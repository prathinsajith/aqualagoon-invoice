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

import { trainingTypeFormSchema, TrainingTypeFormSchema } from "@/schemas/training";
import { useTrainingTypeMutations } from "@/hooks/queries/use-training";
import { getApiErrorMessage } from "@/lib/api-error";
import type { TrainingType } from "@/types/training";

interface TrainingTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainingType?: TrainingType | null;
}

export function TrainingTypeFormDialog({
  open,
  onOpenChange,
  trainingType,
}: TrainingTypeFormDialogProps) {
  const isEdit = !!trainingType;
  const { create, update } = useTrainingTypeMutations();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TrainingTypeFormSchema>({
    resolver: zodResolver(trainingTypeFormSchema),
    mode: "onTouched",
    defaultValues: { name: "", description: "", status: "ACTIVE" },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: trainingType?.name ?? "",
      description: trainingType?.description ?? "",
      status: trainingType?.status ?? "ACTIVE",
    });
  }, [open, trainingType, reset]);

  const status = watch("status");

  const onSubmit = async (values: TrainingTypeFormSchema) => {
    const payload = {
      name: values.name,
      description: values.description || null,
      status: values.status,
    };
    try {
      if (isEdit && trainingType) {
        await update.mutateAsync({ id: trainingType.id, payload });
        toast.success("Training type updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Training type created");
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
          <DialogTitle>{isEdit ? "Edit training type" : "Create training type"}</DialogTitle>
          <DialogDescription>
            Training types group programs (e.g. Swimming, Lifeguarding).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. Swimming" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="What does this training type cover?"
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
              {isSubmitting ? <Spinner /> : isEdit ? "Save changes" : "Create training type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
