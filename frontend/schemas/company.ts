import { z } from "zod";

/** ISO 4217 currency codes offered in settings (mirrors the backend list). */
export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SAR", "AUD", "CAD", "SGD"] as const;

const prefix = (label: string) =>
    z
        .string()
        .trim()
        .min(1, `${label} is required`)
        .max(10)
        .regex(/^[A-Za-z0-9]+$/, "Letters and numbers only");

export const companySchema = z.object({
    name: z.string().trim().min(1, "Company name is required").max(120),
    tagline: z.string().trim().max(160).optional(),
    email: z.union([z.literal(""), z.email("Enter a valid email")]).optional(),
    phone: z.string().trim().max(30).optional(),
    website: z.string().trim().max(200).optional(),
    address: z.string().trim().max(500).optional(),
    userCodePrefix: prefix("User code prefix"),
    invoicePrefix: prefix("Invoice prefix"),
    passPrefix: prefix("Pass prefix"),
    currency: z.enum(CURRENCIES),
    dateFormat: z.string().min(1),
});

export type CompanySchema = z.infer<typeof companySchema>;
