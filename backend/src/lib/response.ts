import { z } from "zod";

/**
 * Centralized response envelope. Every successful handler returns either a bare
 * `{ data }` or, for list endpoints, `{ data, meta: { pagination } }`. Errors
 * use `{ message, code, ... }` (produced by the global error handler).
 *
 * The Zod helpers below build matching response schemas so the shape is enforced
 * by `fastify-type-provider-zod` and reflected in the OpenAPI docs.
 */

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  totalItems: z.number().int(),
  totalPages: z.number().int(),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/** `{ data: <item> }` */
export const dataResponse = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ data: item });

/** `{ data: <item>[], meta: { pagination } }` */
export const paginatedResponse = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    meta: z.object({ pagination: paginationMetaSchema }),
  });

/** `{ message, code, issues? }` — the error envelope. */
export const errorResponse = z.object({
  message: z.string(),
  code: z.string(),
  issues: z
    .array(z.object({ path: z.string(), message: z.string() }))
    .optional(),
});

/** Shared "common error" response map to spread into route schemas. */
export const commonErrors = {
  400: errorResponse,
  401: errorResponse,
  403: errorResponse,
  404: errorResponse,
  409: errorResponse,
} as const;
