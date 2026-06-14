"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { DatePicker, DATE_PICKER_FUTURE_END, DATE_PICKER_PAST_START } from "@/components/ui/date-picker";
import { NumberInput } from "@/components/ui/number-input";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerSelect } from "@/components/billing/customer-select";

import { batchFormSchema, BatchFormSchema } from "@/schemas/training";
import { useBatchMutations, useTrainingPrograms } from "@/hooks/queries/use-training";
import { getApiErrorMessage } from "@/lib/api-error";
import type { TrainingBatch } from "@/types/training";
import type { ManagedUser } from "@/types/rbac";

interface BatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch?: TrainingBatch | null;
}

const emptyToNull = (value: string | undefined): string | null =>
  value && value.length > 0 ? value : null;

export function BatchFormDialog({ open, onOpenChange, batch }: BatchFormDialogProps) {
  const isEdit = !!batch;
  const { create, update } = useBatchMutations();
  const { data: programsData } = useTrainingPrograms({ page: 1, limit: 100, status: "ACTIVE" }, { enabled: open });
  const programs = programsData?.data ?? [];

  // CustomerSelect needs a ManagedUser; keep the picked trainer locally and sync
  // the id into the form. In edit mode we hydrate a minimal user from the batch.
  const [trainer, setTrainer] = useState<ManagedUser | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BatchFormSchema>({
    resolver: zodResolver(batchFormSchema),
    mode: "onTouched",
    defaultValues: {
      trainingProgramId: "",
      trainerId: "",
      name: "",
      startTime: "",
      endTime: "",
      startDate: "",
      endDate: "",
      capacity: 0,
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      trainingProgramId: batch?.trainingProgramId ?? "",
      trainerId: batch?.trainerId ?? "",
      name: batch?.name ?? "",
      startTime: batch?.startTime ?? "",
      endTime: batch?.endTime ?? "",
      startDate: batch?.startDate ?? "",
      endDate: batch?.endDate ?? "",
      capacity: batch?.capacity ?? 0,
      status: batch?.status ?? "ACTIVE",
    });
    setTrainer(
      batch?.trainer
        ? ({
            id: batch.trainer.id,
            firstName: batch.trainer.firstName,
            lastName: batch.trainer.lastName,
            roles: [],
            photoUrl: null,
            phone: null,
            email: null,
          } as unknown as ManagedUser)
        : null,
    );
  }, [open, batch, reset]);

  const trainingProgramId = watch("trainingProgramId");
  const status = watch("status");

  const onPickTrainer = (user: ManagedUser | null) => {
    setTrainer(user);
    setValue("trainerId", user?.id ?? "", { shouldValidate: true });
  };

  const onSubmit = async (values: BatchFormSchema) => {
    const payload = {
      trainingProgramId: values.trainingProgramId,
      trainerId: emptyToNull(values.trainerId),
      name: values.name,
      startTime: emptyToNull(values.startTime),
      endTime: emptyToNull(values.endTime),
      startDate: emptyToNull(values.startDate),
      endDate: emptyToNull(values.endDate),
      capacity: values.capacity,
      status: values.status,
    };
    try {
      if (isEdit && batch) {
        await update.mutateAsync({ id: batch.id, payload });
        toast.success("Batch updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Batch created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit batch" : "Create batch"}</DialogTitle>
          <DialogDescription>
            Batches run a training program on a schedule with a capacity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="trainingProgramId">Program</Label>
              <Select
                value={trainingProgramId}
                onValueChange={(v) => setValue("trainingProgramId", v, { shouldValidate: true })}
              >
                <SelectTrigger id="trainingProgramId" className="w-full">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      No active programs — create one first.
                    </div>
                  )}
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.trainingProgramId && (
                <p className="text-xs text-destructive">{errors.trainingProgramId.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Trainer (optional)</Label>
              <CustomerSelect value={trainer} onChange={onPickTrainer} />
              {errors.trainerId && (
                <p className="text-xs text-destructive">{errors.trainerId.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g. Morning Beginners" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="startTime">Start time</Label>
              <Input id="startTime" type="time" {...register("startTime")} />
              {errors.startTime && (
                <p className="text-xs text-destructive">{errors.startTime.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endTime">End time</Label>
              <Input id="endTime" type="time" {...register("endTime")} />
              {errors.endTime && (
                <p className="text-xs text-destructive">{errors.endTime.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <DatePicker
                id="startDate"
                value={watch("startDate") || ""}
                onChange={(v) => setValue("startDate", v, { shouldValidate: true })}
                placeholder="Select start date"
                startMonth={DATE_PICKER_PAST_START}
                endMonth={DATE_PICKER_FUTURE_END}
              />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endDate">End date</Label>
              <DatePicker
                id="endDate"
                value={watch("endDate") || ""}
                onChange={(v) => setValue("endDate", v, { shouldValidate: true })}
                placeholder="Select end date"
                startMonth={DATE_PICKER_PAST_START}
                endMonth={DATE_PICKER_FUTURE_END}
              />
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capacity</Label>
              <Controller
                control={control}
                name="capacity"
                render={({ field }) => (
                  <NumberInput
                    id="capacity"
                    min={0}
                    step={1}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.capacity}
                  />
                )}
              />
              {errors.capacity && (
                <p className="text-xs text-destructive">{errors.capacity.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setValue("status", v as BatchFormSchema["status"], { shouldValidate: true })
                }
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-destructive">{errors.status.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : isEdit ? "Save changes" : "Create batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
