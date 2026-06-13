import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { toSkipTake } from "../../lib/pagination.js";
import { roleInclude } from "./roles.types.js";
import type { ListRolesQuery, RoleWithRelations } from "./roles.types.js";

export interface PersistRoleInput {
  name: string;
  description?: string | null;
  permissionIds: string[];
  displayOrder?: number;
}

export interface UpdateRoleData {
  name?: string;
  description?: string | null;
  /** When provided, the role's permissions are fully replaced with this set. */
  permissionIds?: string[];
}

export class RolesRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(query: ListRolesQuery): Promise<{ rows: RoleWithRelations[]; total: number }> {
    const where: Prisma.RoleWhereInput = query.search
      ? { name: { contains: query.search, mode: "insensitive" } }
      : {};
    const { skip, take } = toSkipTake(query.page, query.limit);

    const [rows, total] = await Promise.all([
      this.db.role.findMany({
        where,
        include: roleInclude,
        // Roles use the admin-defined drag order; name breaks ties.
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        skip,
        take,
      }),
      this.db.role.count({ where }),
    ]);

    return { rows, total };
  }

  /** Persists a new drag order: displayOrder = position in `orderedIds`. */
  async reorder(orderedIds: string[]): Promise<void> {
    await this.db.$transaction(
      orderedIds.map((id, index) =>
        this.db.role.update({ where: { id }, data: { displayOrder: index } }),
      ),
    );
  }

  /** Highest displayOrder in use, so a newly created role can be appended. */
  async maxDisplayOrder(): Promise<number> {
    const top = await this.db.role.findFirst({
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    return top?.displayOrder ?? 0;
  }

  findById(id: string): Promise<RoleWithRelations | null> {
    return this.db.role.findUnique({ where: { id }, include: roleInclude });
  }

  async findIdByName(name: string, excludeId?: string): Promise<string | null> {
    const row = await this.db.role.findFirst({
      // Case-insensitive so role names can't collide only by casing.
      where: { name: { equals: name, mode: "insensitive" }, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  create(input: PersistRoleInput): Promise<RoleWithRelations> {
    return this.db.role.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        displayOrder: input.displayOrder ?? 0,
        rolePermissions: {
          create: input.permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: roleInclude,
    });
  }

  update(id: string, data: UpdateRoleData): Promise<RoleWithRelations> {
    const { permissionIds, ...scalar } = data;
    return this.db.role.update({
      where: { id },
      data: {
        ...scalar,
        ...(permissionIds
          ? {
              rolePermissions: {
                deleteMany: {},
                create: permissionIds.map((permissionId) => ({ permissionId })),
              },
            }
          : {}),
      },
      include: roleInclude,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.role.delete({ where: { id } });
  }

  /** Replaces the role's assignment scope with the given set of role ids. */
  async setAssignableRoles(id: string, assignableRoleIds: string[]): Promise<RoleWithRelations> {
    return this.db.role.update({
      where: { id },
      data: {
        manages: {
          deleteMany: {},
          create: assignableRoleIds.map((assignableRoleId) => ({ assignableRoleId })),
        },
      },
      include: roleInclude,
    });
  }
}
