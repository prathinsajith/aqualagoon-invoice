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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { NumberInput } from "@/components/ui/number-input";
import { Spinner } from "@/components/ui/spinner";

import { paymentMethodFormSchema, PaymentMethodFormSchema } from "@/schemas/payment-method";
import { usePaymentMethodMutations } from "@/hooks/queries/use-payment-methods";
import { getApiErrorMessage } from "@/lib/api-error";
import type { PaymentMethod } from "@/types/billing";

interface PaymentMethodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method?: PaymentMethod | null;
}

export function PaymentMethodFormDialog({ open, onOpenChange, method }: PaymentMethodFormDialogProps) {
  const isEdit = !!method;
  const { create, update } = usePaymentMethodMutations();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PaymentMethodFormSchema>({
    resolver: zodResolver(paymentMethodFormSchema),
    mode: "onTouched",
    defaultValues: { name: "", description: "", isActive: true, displayOrder: 0 },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: method?.name ?? "",
      description: method?.description ?? "",
      isActive: method?.isActive ?? true,
      displayOrder: method?.displayOrder ?? 0,
    });
  }, [open, method, reset]);

  const onSubmit = async (values: PaymentMethodFormSchema) => {
    const payload = {
      name: values.name,
      description: values.description || null,
      isActive: values.isActive,
      displayOrder: values.displayOrder ?? 0,
    };
    try {
      if (isEdit && method) {
        await update.mutateAsync({ id: method.id, payload });
        toast.success("Payment method updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Payment method created");
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
          <DialogTitle>{isEdit ? "Edit payment method" : "New payment method"}</DialogTitle>
          <DialogDescription>
            Methods available to cashiers at checkout (e.g. Cash, UPI, Card).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. UPI" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea id="description" rows={2} placeholder="Optional note" {...register("description")} />
          </div>

          <div className="grid grid-cols-2 items-start gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayOrder">Display order</Label>
              <Controller
                control={control}
                name="displayOrder"
                render={({ field }) => (
                  <NumberInput
                    id="displayOrder"
                    min={0}
                    step={1}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.displayOrder && (
                <p className="text-xs text-destructive">{errors.displayOrder.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex h-10 items-center gap-2">
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                    <span className="text-sm text-muted-foreground">
                      {field.value ? "Active" : "Inactive"}
                    </span>
                  </div>
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
