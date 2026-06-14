import { z } from "zod";
import { productStatusEnum } from "@/schemas/product";

const passKindEnum = z.enum(["GUEST", "STUDENT", "VIP", "FAMILY", "CORPORATE"]);
const passDurationTypeEnum = z.enum(["HOUR", "DAY", "MONTH", "YEAR"]);
const passEntryTypeEnum = z.enum(["LIMITED", "UNLIMITED"]);
const passDiscountTypeEnum = z.enum(["NONE", "FIXED", "PERCENTAGE"]);

// Keep input === output types (no .coerce/.transform/.default) so the single
// `useForm` generic stays happy. NumberInput emits `undefined` when blank, so
// optional numerics must validate cleanly when cleared; conditional
// requirements (allowedEntries when LIMITED) are enforced in superRefine.
const requiredCount = z
    .number({ message: "Required" })
    .int("Whole numbers only")
    .positive("Must be at least 1");
const optionalCount = z.number().int("Whole numbers only").positive("Must be at least 1").optional();
const requiredPrice = z.number({ message: "Price is required" }).min(0, "Cannot be negative");
const optionalPrice = z.number().min(0, "Cannot be negative").optional();

export const passTypeFormSchema = z
    .object({
        type: passKindEnum,
        name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
        description: z.string().trim().max(1000).optional().or(z.literal("")),
        durationType: passDurationTypeEnum,
        durationValue: requiredCount,
        entryType: passEntryTypeEnum,
        allowedEntries: optionalCount,
        maxEntriesPerDay: optionalCount,
        price: requiredPrice,
        discountType: passDiscountTypeEnum,
        discountValue: optionalPrice,
        status: productStatusEnum,
    })
    .superRefine((val, ctx) => {
        if (val.entryType === "LIMITED" && (val.allowedEntries == null || val.allowedEntries < 1)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["allowedEntries"],
                message: "Required for limited-entry passes",
            });
        }
        if (val.discountType !== "NONE" && (val.discountValue == null || val.discountValue <= 0)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["discountValue"],
                message: "Enter a discount value",
            });
        }
        if (val.discountType === "PERCENTAGE" && (val.discountValue ?? 0) > 100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["discountValue"],
                message: "Cannot exceed 100%",
            });
        }
    });

export type PassTypeFormSchema = z.infer<typeof passTypeFormSchema>;
