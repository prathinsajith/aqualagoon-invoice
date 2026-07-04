import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { BadRequest, Conflict, Forbidden, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { ActorContext } from "../users/users.service.js";
import { RolesRepository } from "./roles.repository.js";
import { toRoleDto } from "./roles.types.js";
import type {
  CreateRoleInput,
  ListRolesQuery,
  RoleDto,
  UpdateRoleInput,
} from "./roles.types.js";

const MODULE = "roles";

export class RolesService {
  private readonly repo: RolesRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new RolesRepository(prisma);
  }

  async list(query: ListRolesQuery): Promise<{ data: RoleDto[]; meta: { pagination: PaginationMeta } }> {
    const { rows, total } = await this.repo.list(query);
    return {
      data: rows.map(toRoleDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async getById(id: string): Promise<RoleDto> {
    const role = await this.repo.findById(id);
    if (!role) throw NotFound("Role not found");
    return toRoleDto(role);
  }

  async create(input: CreateRoleInput, actor: ActorContext): Promise<RoleDto> {
    // Independent validations — run them together.
    await Promise.all([
      this.assertNameAvailable(input.name),
      this.assertPermissionsExist(input.permissionIds),
    ]);

    const role = await this.repo.create({
      name: input.name,
      description: input.description ?? null,
      permissionIds: input.permissionIds,
      // Append to the end of the drag order.
      displayOrder: (await this.repo.maxDisplayOrder()) + 1,
    });

    const dto = toRoleDto(role);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.ROLE_CREATE,
      module: MODULE,
      recordId: dto.id,
      newData: dto,
      ipAddress: actor.ip,
    });
    return dto;
  }

  async update(id: string, input: UpdateRoleInput, actor: ActorContext): Promise<RoleDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw NotFound("Role not found");

    // System roles can be renamed/edited, but never deleted (see `remove`).
    if (input.name) await this.assertNameAvailable(input.name, id);
    if (input.permissionIds) await this.assertPermissionsExist(input.permissionIds);

    const updated = await this.repo.update(id, {
      name: input.name,
      description: input.description,
      permissionIds: input.permissionIds,
    });

    const before = toRoleDto(existing);
    const after = toRoleDto(updated);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.ROLE_UPDATE,
      module: MODULE,
      recordId: id,
      oldData: before,
      newData: after,
      ipAddress: actor.ip,
    });
    return after;
  }

  /** Saves a new top-to-bottom display order for the given role ids. */
  async reorder(orderedIds: string[], actor: ActorContext): Promise<RoleDto[]> {
    const uniqueIds = [...new Set(orderedIds)];
    const found = await this.prisma.role.count({ where: { id: { in: uniqueIds } } });
    if (found !== uniqueIds.length) throw BadRequest("One or more roleIds do not exist");

    await this.repo.reorder(uniqueIds);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.ROLE_UPDATE,
      module: MODULE,
      recordId: null,
      newData: { reordered: uniqueIds },
      ipAddress: actor.ip,
    });
    const { rows } = await this.repo.list({ page: 1, limit: 100, sortOrder: "asc", sortBy: "displayOrder" });
    return rows.map(toRoleDto);
  }

  async remove(id: string, actor: ActorContext): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw NotFound("Role not found");
    if (existing.isSystem) throw Forbidden("System roles cannot be deleted");
    if (existing._count.userRoles > 0) {
      throw Conflict("Cannot delete a role that is still assigned to users");
    }

    await this.repo.delete(id);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.ROLE_DELETE,
      module: MODULE,
      recordId: id,
      oldData: toRoleDto(existing),
      ipAddress: actor.ip,
    });
  }

  /** Replaces which roles members of `id` may assign/view (admin-only action). */
  async setAssignableRoles(
    id: string,
    assignableRoleIds: string[],
    actor: ActorContext,
  ): Promise<RoleDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw NotFound("Role not found");

    const uniqueIds = [...new Set(assignableRoleIds)];
    if (uniqueIds.length > 0) {
      const found = await this.prisma.role.count({ where: { id: { in: uniqueIds } } });
      if (found !== uniqueIds.length) throw BadRequest("One or more roleIds do not exist");
    }

    const updated = await this.repo.setAssignableRoles(id, uniqueIds);
    const after = toRoleDto(updated);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.ROLE_UPDATE,
      module: MODULE,
      recordId: id,
      oldData: toRoleDto(existing),
      newData: after,
      ipAddress: actor.ip,
    });
    return after;
  }

  // --- helpers -------------------------------------------------------------

  private async assertNameAvailable(name: string, excludeId?: string): Promise<void> {
    if (await this.repo.findIdByName(name, excludeId)) {
      throw Conflict("A role with this name already exists");
    }
  }

  private async assertPermissionsExist(permissionIds: string[]): Promise<void> {
    if (permissionIds.length === 0) return;
    const found = await this.prisma.permission.count({ where: { id: { in: permissionIds } } });
    if (found !== new Set(permissionIds).size) {
      throw BadRequest("One or more permissionIds do not exist");
    }
  }
}
