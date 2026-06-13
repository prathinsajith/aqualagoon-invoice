import { randomBytes } from "node:crypto";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { hashPassword } from "../../lib/password.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { BadRequest, Conflict, Forbidden, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import { signResetToken } from "../../lib/tokens.js";
import { sendMail } from "../../lib/mail/mailer.js";
import { setPasswordEmail } from "../../lib/mail/templates.js";
import { loadMailBranding } from "../../lib/mail/branding.js";
import { env } from "../../config/env.js";
import type { StorageDriver } from "../../lib/storage/index.js";

/** Roles that are customers, not system logins — these may have no email. */
const CUSTOMER_ROLE_NAMES = new Set(["Guest", "Student"]);
import { UsersRepository } from "./users.repository.js";
import { toUserDto } from "./users.types.js";
import { roleInclude, toRoleDto } from "../roles/roles.types.js";
import type { RoleDto } from "../roles/roles.types.js";
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
  UserDto,
  UserWithRoles,
} from "./users.types.js";

const MODULE = "users";

/** Context about the actor performing a mutation, for the audit trail. */
export interface ActorContext {
  userId: string | null;
  /** The actor's role names — drives role-assignment scoping for non-admins. */
  roles: string[];
  ip: string | null;
}

export class UsersService {
  private readonly repo: UsersRepository;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: StorageDriver,
  ) {
    this.repo = new UsersRepository(prisma);
  }

  async list(
    query: ListUsersQuery,
    actor: ActorContext,
  ): Promise<{ data: UserDto[]; meta: { pagination: PaginationMeta } }> {
    const scope = await this.manageableRoleIds(actor);
    const { rows, total } = await this.repo.list(query, scope ? [...scope] : null);
    return {
      data: rows.map(toUserDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async getById(id: string, actor: ActorContext): Promise<UserDto> {
    const user = await this.repo.findById(id);
    if (!user) throw NotFound("User not found");
    await this.assertUserInScope(user, actor);
    return toUserDto(user);
  }

  /** Roles the actor is allowed to assign/view when managing users. */
  async listAssignableRoles(actor: ActorContext): Promise<RoleDto[]> {
    const scope = await this.manageableRoleIds(actor);
    const roles = await this.prisma.role.findMany({
      where: scope ? { id: { in: [...scope] } } : {},
      include: roleInclude,
      // Follow the admin-defined drag order.
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
    return roles.map(toRoleDto);
  }

  async create(input: CreateUserInput, actor: ActorContext): Promise<UserDto> {
    const roles = await this.fetchRoles(input.roleIds);
    const isLoginUser = this.isLoginUser(roles.map((r) => r.name));

    // Login users (Admin/Staff/Coach/custom) must have an email; customer roles
    // (Guest/Student) may be created without one.
    if (isLoginUser && !input.email) {
      throw BadRequest("Email is required for admin, staff or coach users");
    }

    await Promise.all([
      input.email ? this.assertEmailAvailable(input.email) : Promise.resolve(),
      input.phone ? this.assertPhoneAvailable(input.phone) : Promise.resolve(),
      this.assertRolesAssignable(input.roleIds, actor),
    ]);

    // No password in the form for login users → set a locked random hash now and
    // email them a link to choose their own. An explicit password is still honored.
    const sendSetup = isLoginUser && !!input.email && !input.password;
    const passwordHash = await hashPassword(input.password ?? randomBytes(24).toString("hex"));

    const created = await this.repo.create({
      userCode: await this.generateUserCode(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      passwordHash,
      gender: input.gender ?? null,
      dateOfBirth: input.dateOfBirth ?? null,
      address: input.address ?? null,
      status: input.status,
      roleIds: input.roleIds,
      assignedBy: actor.userId,
    });

    if (sendSetup) await this.sendPasswordSetupEmail(created);

    const dto = toUserDto(created);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.USER_CREATE,
      module: MODULE,
      recordId: dto.id,
      newData: dto,
      ipAddress: actor.ip,
    });
    return dto;
  }

  async update(id: string, input: UpdateUserInput, actor: ActorContext): Promise<UserDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw NotFound("User not found");
    await this.assertUserInScope(existing, actor);

    // Resolve the effective roles + email after the update to enforce the
    // "login users must have an email" rule.
    const effectiveRoleNames = input.roleIds
      ? (await this.fetchRoles(input.roleIds)).map((r) => r.name)
      : existing.userRoles.map((ur) => ur.role.name);
    const effectiveEmail = input.email !== undefined ? input.email : existing.email;
    if (this.isLoginUser(effectiveRoleNames) && !effectiveEmail) {
      throw BadRequest("Email is required for admin, staff or coach users");
    }

    // Run whichever uniqueness/role checks apply in parallel.
    await Promise.all([
      input.email ? this.assertEmailAvailable(input.email, id) : Promise.resolve(),
      input.phone ? this.assertPhoneAvailable(input.phone, id) : Promise.resolve(),
      input.roleIds ? this.assertRolesAssignable(input.roleIds, actor) : Promise.resolve(),
    ]);

    const updated = await this.repo.update(id, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth,
      address: input.address,
      status: input.status,
      roleIds: input.roleIds,
      passwordHash: input.password ? await hashPassword(input.password) : undefined,
      assignedBy: actor.userId,
    });

    const before = toUserDto(existing);
    const after = toUserDto(updated);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.USER_UPDATE,
      module: MODULE,
      recordId: id,
      oldData: before,
      newData: after,
      ipAddress: actor.ip,
    });
    return after;
  }

  async remove(id: string, actor: ActorContext): Promise<void> {
    const existing = await this.repo.findById(id, false);
    if (!existing) throw NotFound("User not found");
    await this.assertUserInScope(existing, actor);
    if (actor.userId === id) throw BadRequest("You cannot delete your own account");

    await this.repo.softDelete(id);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.USER_DELETE,
      module: MODULE,
      recordId: id,
      oldData: toUserDto(existing),
      ipAddress: actor.ip,
    });
  }

  async restore(id: string, actor: ActorContext): Promise<UserDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw NotFound("User not found");
    await this.assertUserInScope(existing, actor);
    if (!existing.deletedAt) throw BadRequest("User is not archived");

    const restored = await this.repo.restore(id);
    const dto = toUserDto(restored);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.USER_RESTORE,
      module: MODULE,
      recordId: id,
      newData: dto,
      ipAddress: actor.ip,
    });
    return dto;
  }

  /** Sets a user's profile photo (admin editing another user). */
  async updatePhoto(id: string, photoUrl: string, actor: ActorContext): Promise<UserDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw NotFound("User not found");
    await this.assertUserInScope(existing, actor);

    const updated = await this.repo.update(id, { photoUrl });

    // Best-effort cleanup of the replaced object (no-op if not one of ours).
    if (existing.photoUrl && existing.photoUrl !== photoUrl) {
      await this.storage.deleteByUrl(existing.photoUrl).catch(() => {});
    }

    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.USER_UPDATE,
      module: MODULE,
      recordId: id,
      newData: { photoUrl },
      ipAddress: actor.ip,
    });
    return toUserDto(updated);
  }

  // --- role-assignment scoping --------------------------------------------

  /**
   * The set of role ids the actor may assign/view, or `null` when unrestricted.
   * Admins are always unrestricted; every other role is limited to the union of
   * its configured assignment scopes (company settings).
   */
  private async manageableRoleIds(actor: ActorContext): Promise<Set<string> | null> {
    if (actor.roles.includes("Admin")) return null;
    const roles = await this.prisma.role.findMany({
      where: { name: { in: actor.roles } },
      select: { manages: { select: { assignableRoleId: true } } },
    });
    const set = new Set<string>();
    for (const role of roles) for (const m of role.manages) set.add(m.assignableRoleId);
    return set;
  }

  /** Rejects assigning any role outside the actor's allowed scope. */
  private async assertRolesAssignable(roleIds: string[], actor: ActorContext): Promise<void> {
    const scope = await this.manageableRoleIds(actor);
    if (!scope) return; // admin / unrestricted
    if (roleIds.some((id) => !scope.has(id))) {
      throw Forbidden("You are not allowed to assign one or more of these roles");
    }
  }

  /**
   * Hides users outside the actor's scope (a non-admin only sees users whose
   * roles all fall within their allowed set). Throws NotFound so existence
   * isn't leaked.
   */
  private async assertUserInScope(user: UserWithRoles, actor: ActorContext): Promise<void> {
    const scope = await this.manageableRoleIds(actor);
    if (!scope) return;
    const roleIds = user.userRoles.map((ur) => ur.role.id);
    const inScope = roleIds.length > 0 && roleIds.every((id) => scope.has(id));
    if (!inScope) throw NotFound("User not found");
  }

  // --- helpers -------------------------------------------------------------

  private async assertEmailAvailable(email: string, excludeId?: string): Promise<void> {
    if (await this.repo.findIdByEmail(email, excludeId)) {
      throw Conflict("A user with this email already exists");
    }
  }

  private async assertPhoneAvailable(phone: string, excludeId?: string): Promise<void> {
    if (await this.repo.findIdByPhone(phone, excludeId)) {
      throw Conflict("A user with this phone number already exists");
    }
  }

  /** Validates the role ids exist and returns their (id, name) records. */
  private async fetchRoles(roleIds: string[]): Promise<{ id: string; name: string }[]> {
    if (roleIds.length === 0) return [];
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, name: true },
    });
    if (roles.length !== new Set(roleIds).size) {
      throw BadRequest("One or more roleIds do not exist");
    }
    return roles;
  }

  /** A login user holds at least one non-customer role (needs email + password). */
  private isLoginUser(roleNames: string[]): boolean {
    return roleNames.some((name) => !CUSTOMER_ROLE_NAMES.has(name));
  }

  /**
   * Emails a new login user a one-time link to set their own password. Reuses
   * the password-reset token; if it expires the user can use "forgot password".
   * Best-effort — never fails account creation.
   */
  private async sendPasswordSetupEmail(user: UserWithRoles): Promise<void> {
    if (!user.email) return;
    try {
      const { token } = await signResetToken(user.id, user.tokenVersion);
      const setupUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
      const brand = await loadMailBranding(this.prisma);
      const mail = setPasswordEmail(brand, { name: user.firstName, setupUrl, ttl: env.JWT_RESET_TTL });
      await sendMail({ ...mail, to: user.email });
    } catch (error) {
      console.error("[users] failed to send password-setup email:", error);
    }
  }

  /** Generates a unique, human-friendly user code (e.g. "USR-A1B2C3"). The
   * prefix comes from the company settings (defaults to "USR"). */
  private async generateUserCode(): Promise<string> {
    const company = await this.prisma.companySetting.findFirst({
      select: { userCodePrefix: true },
    });
    const prefix = company?.userCodePrefix?.trim() || "USR";
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = `${prefix}-${randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;
      const exists = await this.prisma.user.findUnique({
        where: { userCode: code },
        select: { id: true },
      });
      if (!exists) return code;
    }
    throw Conflict("Could not allocate a unique user code, please retry");
  }
}
