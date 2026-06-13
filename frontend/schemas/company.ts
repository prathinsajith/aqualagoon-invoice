import { z } from "zod";

export const companySchema = z.object({
    name: z.string().trim().min(1, "Company name is required").max(120),
    tagline: z.string().trim().max(160).optional(),
    email: z.union([z.literal(""), z.email("Enter a valid email")]).optional(),
    phone: z.string().trim().max(30).optional(),
    website: z.string().trim().max(200).optional(),
    address: z.string().trim().max(500).optional(),
    userCodePrefix: z
        .string()
        .trim()
        .min(1, "Required")
        .max(10)
        .regex(/^[A-Za-z0-9]+$/, "Letters and numbers only"),
    dateFormat: z.string().min(1),
});

export type CompanySchema = z.infer<typeof companySchema>;
