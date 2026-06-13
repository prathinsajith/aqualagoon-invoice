import { z } from "zod";

export const paymentMethodFormSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    description: z.string().trim().max(500).optional().or(z.literal("")),
    isActive: z.boolean(),
    displayOrder: z.number().int("Whole numbers only").min(0, "Cannot be negative").optional(),
});
export type PaymentMethodFormSchema = z.infer<typeof paymentMethodFormSchema>;
