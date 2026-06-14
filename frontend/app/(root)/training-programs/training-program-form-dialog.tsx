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

import { trainingProgramFormSchema, TrainingProgramFormSchema } from "@/schemas/training";
import { useTrainingTypes, useTrainingProgramMutations } from "@/hooks/queries/use-training";
import { getApiErrorMessage } from "@/lib/api-error";
import type { TrainingProgram } from "@/types/training";

interface TrainingProgramFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: TrainingProgram | null;
}

const DURATION_TYPES = ["MONTH", "QUARTER", "YEAR", "CUSTOM"] as const;

export function TrainingProgramFormDialog({
  open,
  onOpenChange,
  program,
}: TrainingProgramFormDialogProps) {
  const isEdit = !!program;
  const { create, update } = useTrainingProgramMutations();
  const { data: typesData } = useTrainingTypes({ page: 1, limit: 100, status: "ACTIVE" }, { enabled: open });
  const trainingTypes = typesData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TrainingProgramFormSchema>({
    resolver: zodResolver(trainingProgramFormSchema),
    mode: "onTouched",
    defaultValues: {
      trainingTypeId: "",
      name: "",
      description: "",
      durationType: "MONTH",
      durationValue: 1,
      defaultFee: 0,
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      trainingTypeId: program?.trainingType.id ?? "",
      name: program?.name ?? "",
      description: program?.description ?? "",
      durationType: program?.durationType ?? "MONTH",
      durationValue: program?.durationValue ?? 1,
      defaultFee: program?.defaultFee ?? 0,
      status: program?.status ?? "ACTIVE",
    });
  }, [open, program, reset]);

  const trainingTypeId = watch("trainingTypeId");
  const durationType = watch("durationType");
  const status = watch("status");

  const onSubmit = async (values: TrainingProgramFormSchema) => {
    const payload = {
      trainingTypeId: values.trainingTypeId,
      name: values.name,
      description: values.description || null,
      durationType: values.durationType,
      durationValue: values.durationValue,
      defaultFee: values.defaultFee,
      status: values.status,
    };
    try {
      if (isEdit && program) {
        await update.mutateAsync({ id: program.id, payload });
        toast.success("Training program updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Training program created");
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
          <DialogTitle>{isEdit ? "Edit training program" : "Create training program"}</DialogTitle>
          <DialogDescription>
            A program belongs to a training type and defines its duration and default fee.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="trainingTypeId">Training type</Label>
              <Select
                value={trainingTypeId}
                onValueChange={(v) => setValue("trainingTypeId", v, { shouldValidate: true })}
              >
                <SelectTrigger id="trainingTypeId" className="w-full">
                  <SelectValue placeholder="Select a training type" />
                </SelectTrigger>
                <SelectContent>
                  {trainingTypes.length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      No training types — create one first.
                    </div>
                  )}
                  {trainingTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.trainingTypeId && (
                <p className="text-xs text-destructive">{errors.trainingTypeId.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g. Beginner Swimming" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="durationType">Duration type</Label>
              <Select
                value={durationType}
                onValueChange={(v) =>
                  setValue("durationType", v as TrainingProgramFormSchema["durationType"], {
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
              <Label htmlFor="durationValue">Duration value</Label>
              <Controller
                control={control}
                name="durationValue"
                render={({ field }) => (
                  <NumberInput
                    id="durationValue"
                    min={1}
                    step={1}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.durationValue}
                  />
                )}
              />
              {errors.durationValue && (
                <p className="text-xs text-destructive">{errors.durationValue.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="defaultFee">Default fee</Label>
              <Controller
                control={control}
                name="defaultFee"
                render={({ field }) => (
                  <NumberInput
                    id="defaultFee"
                    decimals
                    min={0}
                    step={1}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.defaultFee}
                  />
                )}
              />
              {errors.defaultFee && (
                <p className="text-xs text-destructive">{errors.defaultFee.message}</p>
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
                placeholder="What does this program cover?"
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
              {isSubmitting ? <Spinner /> : isEdit ? "Save changes" : "Create program"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
