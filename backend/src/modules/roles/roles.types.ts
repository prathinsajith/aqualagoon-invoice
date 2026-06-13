import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  createRoleBody,
  listRolesQuery,
  roleSchema,
  updateRoleBody,
} from "./roles.schema.js";

export type RoleDto = z.infer<typeof roleSchema>;
export type CreateRoleInput = z.infer<typeof createRoleBody>;
export type UpdateRoleInput = z.infer<typeof updateRoleBody>;
export type ListRolesQuery = z.infer<typeof listRolesQuery>;

/** Include that pulls permissions, assigned-user count, and assignment scope. */
export const roleInclude = {
  rolePermissions: { include: { permission: true } },
  manages: { select: { assignableRoleId: true } },
  _count: { select: { userRoles: true } },
} satisfies Prisma.RoleInclude;

export type RoleWithRelations = Prisma.RoleGetPayload<{ include: typeof roleInclude }>;

export function toRoleDto(role: RoleWithRelations): RoleDto {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    displayOrder: role.displayOrder,
    usersCount: role._count.userRoles,
    permissions: role.rolePermissions.map((rp) => ({
      id: rp.permission.id,
      module: rp.permission.module,
      action: rp.permission.action,
      name: rp.permission.name,
    })),
    assignableRoleIds: role.manages.map((m) => m.assignableRoleId),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}
