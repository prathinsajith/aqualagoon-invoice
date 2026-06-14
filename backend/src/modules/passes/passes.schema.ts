import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";
import {
  durationTypeSchema,
  entryTypeSchema,
  passKindSchema,
} from "../pass-types/pass-types.schema.js";

export const userPassStatusSchema = z.enum([
  "PENDING",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
  "SUSPENDED",
]);

const passTypeRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: passKindSchema,
  durationType: durationTypeSchema,
  durationValue: z.number().int(),
  entryType: entryTypeSchema,
});

export const passUsageLogSchema = z.object({
  id: z.string(),
  entryTime: z.date(),
  exitTime: z.date().nullable(),
  remarks: z.string().nullable(),
  createdAt: z.date(),
});

export const userPassSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  holderName: z.string().nullable(),
  holderPhotoUrl: z.string().nullable(),
  passTypeId: z.string(),
  passType: passTypeRefSchema,
  invoiceId: z.string().nullable(),
  passNumber: z.string(),
  startTime: z.date(),
  expiryTime: z.date(),
  originalPrice: z.number(),
  discountAmount: z.number(),
  finalAmount: z.number(),
  remainingEntries: z.number().int().nullable(),
  status: userPassStatusSchema,
  activatedAt: z.date().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/** Detailed pass including its usage history. */
export const userPassDetailSchema = userPassSchema.extend({
  usageLogs: z.array(passUsageLogSchema),
});

export const passIdParams = z.object({ id: z.uuid() });

/**
 * Expiry-proximity windows (relative to "now"), for catching passes about to
 * lapse or just lapsed at the desk:
 *  - expiring5  → expires within the next 5 minutes
 *  - expired5   → expired within the last 5 minutes
 *  - expired10  → expired within the last 10 minutes
 */
export const expiryWindowSchema = z.enum(["expiring5", "expired5", "expired10"]);

export const listPassesQuery = paginationQuery.extend({
  status: userPassStatusSchema.optional(),
  // Filter by pass kind (e.g. GUEST, STUDENT) — joins through the pass type.
  type: passKindSchema.optional(),
  passTypeId: z.uuid().optional(),
  userId: z.uuid().optional(),
  // Filter by when the pass was taken (createdAt) — inclusive window.
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  // Filter by expiry proximity relative to now.
  expiryWindow: expiryWindowSchema.optional(),
  sortBy: z.enum(["createdAt", "expiryTime"]).default("createdAt"),
});

export const usageBody = z.object({
  remarks: z.string().trim().max(500).nullish(),
});

export const renewBody = z.object({
  // Optional override; defaults to the pass type's own duration value.
  durationValue: z.number().int().positive().optional(),
  remarks: z.string().trim().max(500).nullish(),
});

export const suspendCancelBody = z.object({
  reason: z.string().trim().max(500).nullish(),
});
