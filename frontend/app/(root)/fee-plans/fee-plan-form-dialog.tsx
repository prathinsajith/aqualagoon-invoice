"use client";

import { useEffect } from "react";
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

import { feePlanFormSchema, FeePlanFormSchema } from "@/schemas/training";
import { useTrainingPrograms, useFeePlanMutations } from "@/hooks/queries/use-training";
import { getApiErrorMessage } from "@/lib/api-error";
import type { FeePlan } from "@/types/training";

interface FeePlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feePlan?: FeePlan | null;
}

const DURATION_TYPES = ["MONTH", "QUARTER", "YEAR", "CUSTOM"] as const;

export function FeePlanFormDialog({ open, onOpenChange, feePlan }: FeePlanFormDialogProps) {
  const isEdit = !!feePlan;
  const { create, update } = useFeePlanMutations();
  const { data: programsData } = useTrainingPrograms({ page: 1, limit: 100, status: "ACTIVE" }, { enabled: open });
  const programs = programsData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FeePlanFormSchema>({
    resolver: zodResolver(feePlanFormSchema),
    mode: "onTouched",
    defaultValues: {
      trainingProgramId: "",
      name: "",
      durationType: "MONTH",
      durationDays: 30,
      amount: 0,
      description: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      trainingProgramId: feePlan?.program.id ?? "",
      name: feePlan?.name ?? "",
      durationType: feePlan?.durationType ?? "MONTH",
      durationDays: feePlan?.durationDays ?? 30,
      amount: feePlan?.amount ?? 0,
      description: feePlan?.description ?? "",
      status: feePlan?.status ?? "ACTIVE",
    });
  }, [open, feePlan, reset]);

  const trainingProgramId = watch("trainingProgramId");
  const durationType = watch("durationType");
  const status = watch("status");

  const onSubmit = async (values: FeePlanFormSchema) => {
    const payload = {
      trainingProgramId: values.trainingProgramId,
      name: values.name,
      durationType: values.durationType,
      durationDays: values.durationDays,
      amount: values.amount,
      description: values.description || null,
      status: values.status,
    };
    try {
      if (isEdit && feePlan) {
        await update.mutateAsync({ id: feePlan.id, payload });
        toast.success("Fee plan updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Fee plan created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit fee plan" : "Create fee plan"}</DialogTitle>
          <DialogDescription>
            A fee plan defines a billing amount for a training program over a duration.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="trainingProgramId">Training program</Label>
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
                      No programs — create one first.
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
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g. Monthly Plan" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="durationType">Duration type</Label>
              <Select
                value={durationType}
                onValueChange={(v) =>
                  setValue("durationType", v as FeePlanFormSchema["durationType"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="durationType" className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_TYPES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d.charAt(0) + d.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.durationType && (
                <p className="text-xs text-destructive">{errors.durationType.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <NumberInput
                    id="amount"
                    decimals
                    min={0}
                    step={1}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.amount}
                  />
                )}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="durationDays">Validity (days)</Label>
              <Controller
                control={control}
                name="durationDays"
                render={({ field }) => (
                  <NumberInput
                    id="durationDays"
                    min={1}
                    step={1}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.durationDays}
                  />
                )}
              />
              {errors.durationDays && (
                <p className="text-xs text-destructive">{errors.durationDays.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <StatusToggle value={status} onChange={(v) => setValue("status", v)} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">
                Description <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Optional plan details"
                {...register("description")}
              />
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
              {isSubmitting ? <Spinner /> : isEdit ? "Save changes" : "Create fee plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
