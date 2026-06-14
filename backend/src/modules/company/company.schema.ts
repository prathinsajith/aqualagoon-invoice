import { z } from "zod";

/** Public shape of the company profile. */
export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  address: z.string().nullable(),
  logoUrl: z.string().nullable(),
  userCodePrefix: z.string(),
  invoicePrefix: z.string(),
  passPrefix: z.string(),
  currency: z.string(),
  dateFormat: z.string(),
  weeklyOffDays: z.array(z.number().int()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/** Date formats the app supports for display. */
export const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD MMM YYYY"] as const;

/** ISO 4217 currency codes offered in settings. */
export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SAR", "AUD", "CAD", "SGD"] as const;

/** Reusable prefix rule: 1–10 letters/digits, upper-cased. */
const prefixField = z
  .string()
  .trim()
  .min(1)
  .max(10)
  .regex(/^[A-Za-z0-9]+$/, "Letters and numbers only")
  .transform((v) => v.toUpperCase());

/** Editable company fields (partial — send only what changed). */
export const updateCompanyBody = z
  .object({
    name: z.string().trim().min(1).max(120),
    tagline: z.string().trim().max(160).nullable(),
    email: z.email().nullable(),
    phone: z.string().trim().min(3).max(30).nullable(),
    website: z.string().trim().max(200).nullable(),
    address: z.string().trim().max(500).nullable(),
    userCodePrefix: prefixField,
    invoicePrefix: prefixField,
    passPrefix: prefixField,
    currency: z.enum(CURRENCIES),
    dateFormat: z.enum(DATE_FORMATS),
    // Weekly off days (0=Sun … 6=Sat). Specific holidays live in the Holiday table.
    weeklyOffDays: z.array(z.number().int().min(0).max(6)).max(7),
  })
  .partial();

export const companyResponse = z.object({ data: companySchema });
