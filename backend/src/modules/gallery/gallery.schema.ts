import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";

/** Public shape of a gallery image. */
export const gallerySchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  imageUrl: z.string(),
  sortOrder: z.number().int(),
  isPublished: z.boolean(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Multipart text fields arrive as strings, so booleans need explicit parsing —
 * `z.coerce.boolean()` would turn the string "false" into `true` (non-empty
 * strings are truthy). Treats "true"/"1" as true, everything else as false.
 */
const booleanField = z
  .preprocess((v) => (typeof v === "string" ? v === "true" || v === "1" : v), z.boolean())
  .default(true);

/** Metadata sent alongside the uploaded file (multipart text fields). */
export const createGalleryBody = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  category: z.string().trim().min(1).max(60).default("General"),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isPublished: booleanField,
});

export const updateGalleryBody = z
  .object({
    title: z.string().trim().min(1).max(160),
    category: z.string().trim().min(1).max(60),
    sortOrder: z.number().int().min(0),
    isPublished: z.boolean(),
  })
  .partial();

export const galleryIdParams = z.object({ id: z.uuid() });

/** Admin listing (paginated, may include unpublished). */
export const listGalleryQuery = paginationQuery.extend({
  category: z.string().trim().min(1).optional(),
  isPublished: z.coerce.boolean().optional(),
  sortBy: z.enum(["sortOrder", "createdAt"]).default("sortOrder"),
});

/** Public listing (no pagination; published only). */
export const publicGalleryQuery = z.object({
  category: z.string().trim().min(1).optional(),
});
