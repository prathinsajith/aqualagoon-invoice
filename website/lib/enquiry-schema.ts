import { z } from "zod";

// Mirrors the backend `createEnquiryBody` (backend/src/modules/enquiries/
// enquiries.schema.ts) so the client rejects bad input before it ever hits the
// API and the user sees the same rules the server enforces.
export const enquiryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name")
    .max(120, "Name is too long"),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number")
    .max(60, "Phone number is too long")
    // Digits, spaces, and + ( ) - are the characters real phone numbers use.
    .regex(/^[+\d][\d\s()-]*$/, "Enter a valid phone number"),
  // Optional — but when the visitor does enter something, it must be a valid
  // address (we email them a confirmation). Empty is allowed.
  email: z
    .string()
    .trim()
    .max(160, "Email is too long")
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email address")
    .optional(),
  service: z.string().trim().max(120).optional(),
  message: z.string().trim().max(2000, "Message is too long").optional(),
});

export type EnquiryFormValues = z.infer<typeof enquiryFormSchema>;
