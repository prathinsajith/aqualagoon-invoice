import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";

export const auditUserRefSchema = z
  .object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().nullable(),
  })
  .nullable();

export const auditLogSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  action: z.string(),
  module: z.string(),
  recordId: z.string().nullable(),
  oldData: z.any(),
  newData: z.any(),
  ipAddress: z.string().nullable(),
  createdAt: z.date(),
  user: auditUserRefSchema,
});

export const listAuditLogsQuery = paginationQuery.extend({
  userId: z.uuid().optional(),
  module: z.string().trim().min(1).optional(),
  action: z.string().trim().min(1).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});
