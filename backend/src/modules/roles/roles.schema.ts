import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";
import { permissionSchema } from "../permissions/permissions.schema.js";

/** Public shape of a role, including its permission set and assigned-user count. */
export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  displayOrder: z.number().int(),
  usersCount: z.number().int(),
  permissions: z.array(permissionSchema),
  /** Role ids a member of this role may assign/view when managing users. */
  assignableRoleIds: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/** Body for replacing a role's assignment scope (company settings, admin-only). */
export const setAssignableRolesBody = z.object({
  assignableRoleIds: z.array(z.uuid()),
});

export const createRoleBody = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  permissionIds: z.array(z.uuid()).default([]),
});

export const updateRoleBody = z
  .object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(500).nullable(),
    permissionIds: z.array(z.uuid()),
  })
  .partial();

export const roleIdParams = z.object({ id: z.uuid() });

/** New drag order, top-to-bottom. */
export const reorderRolesBody = z.object({
  orderedIds: z.array(z.uuid()).min(1),
});

export const listRolesQuery = paginationQuery.extend({
  sortBy: z.enum(["createdAt", "name", "displayOrder"]).default("displayOrder"),
});
