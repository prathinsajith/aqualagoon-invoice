import type { PrismaClient } from "../../generated/prisma/client.js";
import { BadRequest, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { ActorContext } from "../users/users.service.js";
import { PermissionsRepository } from "./permissions.repository.js";
import type { PermissionDto } from "./permissions.types.js";

const MODULE = "permissions";

export class PermissionsService {
  private readonly repo: PermissionsRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new PermissionsRepository(prisma);
  }

  list(module?: string): Promise<PermissionDto[]> {
    return this.repo.listAll(module);
  }

  async listForRole(roleId: string): Promise<PermissionDto[]> {
    await this.assertRoleExists(roleId);
    return this.repo.permissionsForRole(roleId);
  }

  async assign(
    roleId: string,
    permissionIds: string[],
    actor: ActorContext,
  ): Promise<PermissionDto[]> {
    await this.assertRoleExists(roleId);

    const found = await this.repo.countByIds(permissionIds);
    if (found !== new Set(permissionIds).size) {
      throw BadRequest("One or more permissionIds do not exist");
    }

    await this.repo.addToRole(roleId, permissionIds);
    const permissions = await this.repo.permissionsForRole(roleId);

    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PERMISSION_ASSIGNMENT,
      module: MODULE,
      recordId: roleId,
      newData: { added: permissionIds },
      ipAddress: actor.ip,
    });
    return permissions;
  }

  async revoke(
    roleId: string,
    permissionId: string,
    actor: ActorContext,
  ): Promise<void> {
    await this.assertRoleExists(roleId);

    const removed = await this.repo.removeFromRole(roleId, permissionId);
    if (removed === 0) throw NotFound("That permission is not assigned to this role");

    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.PERMISSION_ASSIGNMENT,
      module: MODULE,
      recordId: roleId,
      oldData: { removed: permissionId },
      ipAddress: actor.ip,
    });
  }

  private async assertRoleExists(roleId: string): Promise<void> {
    if (!(await this.repo.roleExists(roleId))) throw NotFound("Role not found");
  }
}
