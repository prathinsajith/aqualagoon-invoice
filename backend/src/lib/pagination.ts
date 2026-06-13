import { z } from "zod";
import type { PaginationMeta } from "./response.js";

/**
 * Reusable querystring schema for paginated + searchable + sortable list
 * endpoints. Individual routes extend this with their own `filter`/`sortBy`
 * enums via `.extend()`.
 */
export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().min(1).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationQuery = z.infer<typeof paginationQuery>;

/** Converts a 1-indexed page + limit into a Prisma `skip`/`take` pair. */
export const toSkipTake = (page: number, limit: number) => ({
  skip: (page - 1) * limit,
  take: limit,
});

/** Builds the pagination meta block from the page, limit and total count. */
export const buildPaginationMeta = (
  page: number,
  limit: number,
  totalItems: number,
): PaginationMeta => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});
