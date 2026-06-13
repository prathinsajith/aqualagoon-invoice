import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { toSkipTake } from "../../lib/pagination.js";
import { userInclude } from "./users.types.js";
import type { ListUsersQuery, UserWithRoles } from "./users.types.js";

/** Fields the repository accepts when persisting a user (already hashed/derived). */
export interface PersistUserInput {
  userCode: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  passwordHash: string;
  gender?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  roleIds: string[];
  assignedBy?: string | null;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  passwordHash?: string;
  gender?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  /** When provided, the user's roles are fully replaced with this set. */
  roleIds?: string[];
  assignedBy?: string | null;
}

/** Database access for the users module. No business logic lives here. */
export class UsersRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(
    query: ListUsersQuery,
    scopeRoleIds: string[] | null = null,
  ): Promise<{ rows: UserWithRoles[]; total: number }> {
    const where = this.buildWhere(query, scopeRoleIds);
    const { skip, take } = toSkipTake(query.page, query.limit);

    const [rows, total] = await Promise.all([
      this.db.user.findMany({
        where,
        include: userInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      this.db.user.count({ where }),
    ]);

    return { rows, total };
  }

  findById(id: string, includeDeleted = true): Promise<UserWithRoles | null> {
    return this.db.user.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: userInclude,
    });
  }

  /** Returns the id of any user (incl. archived) holding this email, or null. */
  async findIdByEmail(email: string, excludeId?: string): Promise<string | null> {
    const row = await this.db.user.findFirst({
      // Emails are case-insensitive.
      where: { email: { equals: email, mode: "insensitive" }, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async findIdByPhone(phone: string, excludeId?: string): Promise<string | null> {
    const row = await this.db.user.findFirst({
      where: { phone, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  create(input: PersistUserInput): Promise<UserWithRoles> {
    return this.db.user.create({
      data: {
        userCode: input.userCode,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone ?? null,
        passwordHash: input.passwordHash,
        gender: input.gender ?? null,
        dateOfBirth: input.dateOfBirth ?? null,
        address: input.address ?? null,
        status: input.status,
        userRoles: {
          create: input.roleIds.map((roleId) => ({
            roleId,
            assignedBy: input.assignedBy ?? null,
          })),
        },
      },
      include: userInclude,
    });
  }

  update(id: string, data: UpdateUserData): Promise<UserWithRoles> {
    const { roleIds, assignedBy, ...scalar } = data;
    return this.db.user.update({
      where: { id },
      data: {
        ...scalar,
        ...(roleIds
          ? {
              userRoles: {
                deleteMany: {},
                create: roleIds.map((roleId) => ({ roleId, assignedBy: assignedBy ?? null })),
              },
            }
          : {}),
      },
      include: userInclude,
    });
  }

  softDelete(id: string): Promise<UserWithRoles> {
    return this.db.user.update({
      where: { id },
      // Bump tokenVersion so any outstanding sessions are invalidated.
      data: { deletedAt: new Date(), tokenVersion: { increment: 1 } },
      include: userInclude,
    });
  }

  restore(id: string): Promise<UserWithRoles> {
    return this.db.user.update({
      where: { id },
      data: { deletedAt: null },
      include: userInclude,
    });
  }

  private buildWhere(
    query: ListUsersQuery,
    scopeRoleIds: string[] | null = null,
  ): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};
    const and: Prisma.UserWhereInput[] = [];

    if (query.onlyDeleted) where.deletedAt = { not: null };
    else if (!query.includeDeleted) where.deletedAt = null;

    if (query.status) where.status = query.status;
    if (query.roleId) and.push({ userRoles: { some: { roleId: query.roleId } } });

    // Role-assignment scope: only users whose roles all fall within the actor's
    // allowed set (and who have at least one such role).
    if (scopeRoleIds) {
      and.push({ userRoles: { some: { roleId: { in: scopeRoleIds } } } });
      and.push({ userRoles: { every: { roleId: { in: scopeRoleIds } } } });
    }

    if (and.length > 0) where.AND = and;

    if (query.createdFrom || query.createdTo) {
      where.createdAt = {
        ...(query.createdFrom ? { gte: query.createdFrom } : {}),
        ...(query.createdTo ? { lte: query.createdTo } : {}),
      };
    }

    if (query.search) {
      const contains = { contains: query.search, mode: "insensitive" as const };
      where.OR = [
        { firstName: contains },
        { lastName: contains },
        { email: contains },
        { phone: contains },
        { userCode: contains },
      ];
    }

    return where;
  }
}
