import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";

export const enquiryStatusSchema = z.enum(["NEW", "CONTACTED", "CLOSED"]);

/** Public shape returned to the admin. */
export const enquirySchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  service: z.string().nullable(),
  message: z.string().nullable(),
  eventDate: z.date().nullable(),
  eventType: z.string().nullable(),
  guests: z.string().nullable(),
  source: z.string(),
  status: enquiryStatusSchema,
  handledBy: z.string().nullable(),
  handledAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/** Body accepted from the public website form (unauthenticated). */
export const createEnquiryBody = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    // Optional — the contact form sends a phone, the booking form sends an email.
    // The refine below guarantees at least one contact method is present.
    phone: z.string().trim().max(60).optional().or(z.literal("")),
    email: z.string().trim().email("Enter a valid email").max(160).optional().or(z.literal("")),
    service: z.string().trim().max(120).optional().or(z.literal("")),
    message: z.string().trim().max(2000).optional().or(z.literal("")),
    // Private-event booking fields (sent only when source = "booking").
    eventDate: z.coerce.date().optional(),
    eventType: z.string().trim().max(120).optional().or(z.literal("")),
    guests: z.string().trim().max(40).optional().or(z.literal("")),
    source: z.enum(["contact", "booking"]).default("contact"),
  })
  .refine((d) => !!d.phone?.trim() || !!d.email?.trim(), {
    message: "Provide a phone number or email so we can reach you",
    path: ["phone"],
  });

export const updateEnquiryBody = z.object({
  status: enquiryStatusSchema,
});

export const enquiryIdParams = z.object({ id: z.uuid() });

export const listEnquiriesQuery = paginationQuery.extend({
  status: enquiryStatusSchema.optional(),
  source: z.enum(["contact", "booking"]).optional(),
});
