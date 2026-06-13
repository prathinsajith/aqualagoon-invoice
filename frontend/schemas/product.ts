import { z } from "zod";

export const productStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);

export const categoryFormSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
    description: z.string().trim().max(1000).optional().or(z.literal("")),
    status: productStatusEnum,
});
export type CategoryFormSchema = z.infer<typeof categoryFormSchema>;

// Only `sellingPrice` is required. The other numeric fields are optional and
// default to 0 on submit — the NumberInput emits `undefined` when blank, so a
// cleared optional field must validate cleanly (no "required" error). Schemas
// keep input === output types (no .coerce/.transform/.default) so the single
// `useForm` generic stays happy.
const requiredPrice = z
    .number({ message: "Selling price is required" })
    .min(0, "Cannot be negative");
const optionalPrice = z.number().min(0, "Cannot be negative").optional();
const optionalCount = z
    .number()
    .int("Whole numbers only")
    .min(0, "Cannot be negative")
    .optional();

export const productFormSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(200),
    categoryId: z.string().min(1, "Category is required"),
    barcode: z.string().trim().max(64).optional().or(z.literal("")),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    purchasePrice: optionalPrice,
    sellingPrice: requiredPrice,
    taxPercentage: z.number().min(0, "Cannot be negative").max(100, "Cannot exceed 100").optional(),
    stockQuantity: optionalCount,
    minimumStock: optionalCount,
    status: productStatusEnum,
});
export type ProductFormSchema = z.infer<typeof productFormSchema>;
