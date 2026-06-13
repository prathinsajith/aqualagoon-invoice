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
import { StatusToggle } from "@/components/ui/status-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { passTypeFormSchema, PassTypeFormSchema } from "@/schemas/pass";
import { usePassTypeMutations } from "@/hooks/queries/use-pass-types";
import { getApiErrorMessage } from "@/lib/api-error";
import { PASS_KIND_LABELS } from "@/lib/pass-format";
import type { PassKind, PassType } from "@/types/pass";

interface PassTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passType?: PassType | null;
}

const KIND_OPTIONS = Object.keys(PASS_KIND_LABELS) as PassKind[];

const DURATION_OPTIONS: { value: PassTypeFormSchema["durationType"]; label: string }[] = [
  { value: "HOUR", label: "Hour(s)" },
  { value: "DAY", label: "Day(s)" },
  { value: "MONTH", label: "Month(s)" },
  { value: "YEAR", label: "Year(s)" },
];

export function PassTypeFormDialog({ open, onOpenChange, passType }: PassTypeFormDialogProps) {
  const isEdit = !!passType;
  const { create, update } = usePassTypeMutations();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PassTypeFormSchema>({
    resolver: zodResolver(passTypeFormSchema),
    mode: "onTouched",
    defaultValues: {
      type: "GUEST",
      name: "",
      description: "",
      durationType: "HOUR",
      durationValue: 1,
      entryType: "UNLIMITED",
      allowedEntries: undefined,
      maxEntriesPerDay: undefined,
      price: 0,
      discountType: "NONE",
      discountValue: undefined,
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      type: passType?.type ?? "GUEST",
      name: passType?.name ?? "",
      description: passType?.description ?? "",
      durationType: passType?.durationType ?? "HOUR",
      durationValue: passType?.durationValue ?? 1,
      entryType: passType?.entryType ?? "UNLIMITED",
      allowedEntries: passType?.allowedEntries ?? undefined,
      maxEntriesPerDay: passType?.maxEntriesPerDay ?? undefined,
      price: passType?.price ?? 0,
      discountType: passType?.discountType ?? "NONE",
      discountValue: passType?.discountValue || undefined,
      status: passType?.status ?? "ACTIVE",
    });
  }, [open, passType, reset]);

  const type = watch("type");
  const durationType = watch("durationType");
  const entryType = watch("entryType");
  const discountType = watch("discountType");
  const status = watch("status");

  const onSubmit = async (values: PassTypeFormSchema) => {
    const payload = {
      type: values.type,
      name: values.name,
      description: values.description || null,
      durationType: values.durationType,
      durationValue: values.durationValue,
      entryType: values.entryType,
      // Entries only apply to LIMITED passes.
      allowedEntries: values.entryType === "LIMITED" ? values.allowedEntries ?? null : null,
      maxEntriesPerDay: values.maxEntriesPerDay ?? null,
      price: values.price,
      discountType: values.discountType,
      discountValue: values.discountType === "NONE" ? 0 : values.discountValue ?? 0,
      status: values.status,
    };
    try {
      if (isEdit && passType) {
        await update.mutateAsync({ id: passType.id, payload });
        toast.success("Pass type updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Pass type created");
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
          <DialogTitle>{isEdit ? "Edit pass type" : "Create pass type"}</DialogTitle>
          <DialogDescription>
            Define a sellable pass: its validity window, entry rules, and price.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g. Guest 2 Hour Pass" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">Category</Label>
              <Select value={type} onValueChange={(v) => setValue("type", v as PassKind)}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {PASS_KIND_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <StatusToggle value={status} onChange={(v) => setValue("status", v)} />
            </div>

            {/* Validity window */}
            <div className="space-y-1.5">
              <Label htmlFor="durationValue">Valid for</Label>
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
              <Label htmlFor="durationType">Duration unit</Label>
              <Select
                value={durationType}
                onValueChange={(v) => setValue("durationType", v as PassTypeFormSchema["durationType"])}
              >
                <SelectTrigger id="durationType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Entry rules */}
            <div className="space-y-1.5">
              <Label htmlFor="entryType">Entry type</Label>
              <Select
                value={entryType}
                onValueChange={(v) => setValue("entryType", v as PassTypeFormSchema["entryType"])}
              >
                <SelectTrigger id="entryType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNLIMITED">Unlimited entries</SelectItem>
                  <SelectItem value="LIMITED">Limited entries</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {entryType === "LIMITED" ? (
              <div className="space-y-1.5">
                <Label htmlFor="allowedEntries">Allowed entries</Label>
                <Controller
                  control={control}
                  name="allowedEntries"
                  render={({ field }) => (
                    <NumberInput
                      id="allowedEntries"
                      min={1}
                      step={1}
                      placeholder="e.g. 10"
                      value={field.value}
                      onChange={field.onChange}
                      invalid={!!errors.allowedEntries}
                    />
                  )}
                />
                {errors.allowedEntries && (
                  <p className="text-xs text-destructive">{errors.allowedEntries.message}</p>
                )}
              </div>
            ) : (
              <div className="hidden sm:block" />
            )}

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="maxEntriesPerDay">
                Max entries per day{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Controller
                control={control}
                name="maxEntriesPerDay"
                render={({ field }) => (
                  <NumberInput
                    id="maxEntriesPerDay"
                    min={1}
                    step={1}
                    placeholder="No daily limit"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.maxEntriesPerDay}
                  />
                )}
              />
              {errors.maxEntriesPerDay && (
                <p className="text-xs text-destructive">{errors.maxEntriesPerDay.message}</p>
              )}
            </div>

            {/* Pricing */}
            <div className="space-y-1.5">
              <Label htmlFor="price">Price</Label>
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <NumberInput
                    id="price"
                    decimals
                    min={0}
                    step={1}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.price}
                  />
                )}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="discountType">Discount</Label>
              <Select
                value={discountType}
                onValueChange={(v) => setValue("discountType", v as PassTypeFormSchema["discountType"])}
              >
                <SelectTrigger id="discountType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No discount</SelectItem>
                  <SelectItem value="FIXED">Fixed amount</SelectItem>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {discountType !== "NONE" && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="discountValue">
                  {discountType === "PERCENTAGE" ? "Discount percentage" : "Discount amount"}
                </Label>
                <Controller
                  control={control}
                  name="discountValue"
                  render={({ field }) => (
                    <NumberInput
                      id="discountValue"
                      decimals
                      min={0}
                      max={discountType === "PERCENTAGE" ? 100 : undefined}
                      step={1}
                      placeholder={discountType === "PERCENTAGE" ? "e.g. 10" : "e.g. 50"}
                      value={field.value}
                      onChange={field.onChange}
                      invalid={!!errors.discountValue}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Discount is baked into the catalog price shown at the POS.
                </p>
                {errors.discountValue && (
                  <p className="text-xs text-destructive">{errors.discountValue.message}</p>
                )}
              </div>
            )}

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">
                Description <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="What does this pass include?"
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
              {isSubmitting ? <Spinner /> : isEdit ? "Save changes" : "Create pass type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
