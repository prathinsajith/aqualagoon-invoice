import type { PrismaClient } from "../../generated/prisma/client.js";
import type { PermissionDto } from "./permissions.types.js";

export class PermissionsRepository {
  constructor(private readonly db: PrismaClient) {}

  listAll(module?: string): Promise<PermissionDto[]> {
    return this.db.permission.findMany({
      where: module ? { module } : {},
      orderBy: [{ module: "asc" }, { action: "asc" }],
      select: { id: true, module: true, action: true, name: true },
    });
  }

  roleExists(roleId: string): Promise<{ id: string } | null> {
    return this.db.role.findUnique({ where: { id: roleId }, select: { id: true } });
  }

  countByIds(ids: string[]): Promise<number> {
    return this.db.permission.count({ where: { id: { in: ids } } });
  }

  permissionsForRole(roleId: string): Promise<PermissionDto[]> {
    return this.db.permission.findMany({
      where: { rolePermissions: { some: { roleId } } },
      orderBy: [{ module: "asc" }, { action: "asc" }],
      select: { id: true, module: true, action: true, name: true },
    });
  }

  async addToRole(roleId: string, permissionIds: string[]): Promise<void> {
    await this.db.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    });
  }

  async removeFromRole(roleId: string, permissionId: string): Promise<number> {
    const result = await this.db.rolePermission.deleteMany({ where: { roleId, permissionId } });
    return result.count;
  }
}
