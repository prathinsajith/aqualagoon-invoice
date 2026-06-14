"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { DatePicker, DATE_PICKER_FUTURE_END, DATE_PICKER_PAST_START } from "@/components/ui/date-picker";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useEnrollments, useFeePlans, useStudentFeeMutations } from "@/hooks/queries/use-training";
import { getApiErrorMessage } from "@/lib/api-error";

interface GenerateFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FeeFormValues {
  amount?: number;
  discountAmount?: number;
  dueDate: string;
}

export function GenerateFeeDialog({ open, onOpenChange }: GenerateFeeDialogProps) {
  const [enrollmentId, setEnrollmentId] = useState("");
  const [feePlanId, setFeePlanId] = useState("");

  const { create } = useStudentFeeMutations();

  const { data: enrollmentsData } = useEnrollments({ page: 1, limit: 100, status: "ACTIVE" });
  const enrollments = enrollmentsData?.data ?? [];

  const { data: feePlansData } = useFeePlans({ page: 1, limit: 100 });
  const feePlans = feePlansData?.data ?? [];

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<FeeFormValues>({
    defaultValues: { amount: undefined, discountAmount: 0, dueDate: "" },
  });

  // No reset effect needed: the parent mounts this dialog only while open
  // (`{generateOpen && <GenerateFeeDialog … />}`), so every open is a fresh
  // mount starting from these defaults.

  const onSubmit = async (values: FeeFormValues) => {
    if (!enrollmentId) {
      toast.error("Select an enrollment");
      return;
    }
    try {
      await create.mutateAsync({
        enrollmentId,
        feePlanId: feePlanId || null,
        amount: values.amount,
        discountAmount: values.discountAmount ?? 0,
        dueDate: values.dueDate || null,
      });
      toast.success("Fee generated");
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to generate fee"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate fee</DialogTitle>
          <DialogDescription>Raise a fee against a student enrollment.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="enrollmentId">Enrollment</Label>
            <Select value={enrollmentId} onValueChange={setEnrollmentId}>
              <SelectTrigger id="enrollmentId" className="w-full">
                <SelectValue placeholder="Select an enrollment" />
              </SelectTrigger>
              <SelectContent>
                {enrollments.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No active enrollments available.
                  </div>
                )}
                {enrollments.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.student.firstName} {e.student.lastName} — {e.batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feePlanId">
              Fee plan <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Select
              value={feePlanId || "none"}
              onValueChange={(v) => setFeePlanId(v === "none" ? "" : v)}
            >
              <SelectTrigger id="feePlanId" className="w-full">
                <SelectValue placeholder="No fee plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No fee plan</SelectItem>
                {feePlans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">
                Amount <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <NumberInput
                    id="amount"
                    decimals
                    min={0}
                    step={1}
                    placeholder="Plan amount"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="discountAmount">Discount</Label>
              <Controller
                control={control}
                name="discountAmount"
                render={({ field }) => (
                  <NumberInput
                    id="discountAmount"
                    decimals
                    min={0}
                    step={1}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dueDate">
              Due date <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Controller
              control={control}
              name="dueDate"
              render={({ field }) => (
                <DatePicker
                  id="dueDate"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select due date"
                  startMonth={DATE_PICKER_PAST_START}
                  endMonth={DATE_PICKER_FUTURE_END}
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || create.isPending}>
              {isSubmitting || create.isPending ? <Spinner /> : "Generate fee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
