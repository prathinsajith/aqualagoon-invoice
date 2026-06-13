import { z } from "zod";

/** Public shape of a permission row. */
export const permissionSchema = z.object({
  id: z.string(),
  module: z.string(),
  action: z.string(),
  name: z.string(),
});

/** Body for assigning permissions to a role (additive, idempotent). */
export const assignPermissionsBody = z.object({
  permissionIds: z.array(z.uuid()).min(1).max(200),
});

/** Params for `/roles/:id/permissions/:permissionId`. */
export const rolePermissionParams = z.object({
  id: z.uuid(),
  permissionId: z.uuid(),
});

export const listPermissionsQuery = z.object({
  module: z.string().trim().min(1).optional(),
});
