import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta, toSkipTake } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { BadRequest, NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { AuditActionType } from "../../lib/audit.js";
import { addDuration, validatePassForEntry } from "../../lib/pass.js";
import type { ActorContext } from "../users/users.service.js";
import {
  toUserPassDetailDto,
  toUserPassDto,
  userPassDetailInclude,
  userPassInclude,
} from "./passes.types.js";
import type {
  ListPassesQuery,
  UserPassDetailDto,
  UserPassDto,
} from "./passes.types.js";

const MODULE = "passes";

export class PassesService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(
    query: ListPassesQuery,
  ): Promise<{ data: UserPassDto[]; meta: { pagination: PaginationMeta } }> {
    // Reflect expiry immediately on read (the daily job is only a backstop).
    await this.expireStale();
    const where: Prisma.UserPassWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.type) where.passType = { type: query.type };
    if (query.passTypeId) where.passTypeId = query.passTypeId;
    if (query.userId) where.userId = query.userId;
    if (query.search) where.passNumber = { contains: query.search, mode: "insensitive" };
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        ...(query.dateFrom ? { gte: query.dateFrom } : {}),
        ...(query.dateTo ? { lte: query.dateTo } : {}),
      };
    }
    if (query.expiryWindow) {
      const now = new Date();
      const minutes = (m: number) => new Date(now.getTime() + m * 60_000);
      where.expiryTime =
        query.expiryWindow === "expiring5"
          ? { gt: now, lte: minutes(5) } // lapses within the next 5 minutes
          : query.expiryWindow === "expired5"
            ? { gte: minutes(-5), lte: now } // lapsed within the last 5 minutes
            : { gte: minutes(-10), lte: now }; // lapsed within the last 10 minutes
    }

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await Promise.all([
      this.prisma.userPass.findMany({
        where,
        include: userPassInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      this.prisma.userPass.count({ where }),
    ]);
    return {
      data: rows.map(toUserPassDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async getById(id: string): Promise<UserPassDetailDto> {
    await this.expireStale(id);
    const pass = await this.prisma.userPass.findUnique({
      where: { id },
      include: userPassDetailInclude,
    });
    if (!pass) throw NotFound("Pass not found");
    return toUserPassDetailDto(pass);
  }

  /** Activates a PENDING pass: sets the validity window and marks it ACTIVE. */
  async activate(id: string, actor: ActorContext): Promise<UserPassDto> {
    const pass = await this.prisma.userPass.findUnique({
      where: { id },
      include: { passType: true },
    });
    if (!pass) throw NotFound("Pass not found");
    if (pass.status === "ACTIVE") throw BadRequest("Pass is already active");
    if (pass.status === "CANCELLED") throw BadRequest("Cancelled passes cannot be activated");

    const now = new Date();
    const expiry = addDuration(now, pass.passType.durationType, pass.passType.durationValue);
    // A single-entry pass is consumed the moment it's taken — activation IS the
    // one entry, so it starts with 0 left and that entry is logged at this time.
    const isSingleEntry =
      pass.passType.entryType === "LIMITED" && pass.passType.allowedEntries === 1;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.userPass.update({
        where: { id },
        data: {
          status: "ACTIVE",
          startTime: now,
          expiryTime: expiry,
          activatedAt: now,
          remainingEntries:
            pass.passType.entryType === "LIMITED"
              ? isSingleEntry
                ? 0
                : pass.passType.allowedEntries
              : null,
        },
        include: userPassInclude,
      });
      if (isSingleEntry) {
        await tx.passUsageLog.create({
          data: {
            userPassId: id,
            userId: pass.userId,
            entryTime: now,
            remarks: "Entry recorded on issue (single-entry pass)",
          },
        });
      }
      return row;
    });

    await this.audit(actor, AuditAction.PASS_ACTIVATED, id, { status: pass.status }, { status: "ACTIVE" });
    return toUserPassDto(updated);
  }

  async suspend(id: string, reason: string | null | undefined, actor: ActorContext): Promise<UserPassDto> {
    const pass = await this.requirePass(id);
    if (pass.status !== "ACTIVE") throw BadRequest("Only active passes can be suspended");
    const updated = await this.setStatus(id, "SUSPENDED");
    await this.audit(actor, AuditAction.PASS_SUSPENDED, id, { status: pass.status }, { status: "SUSPENDED", reason: reason ?? null });
    return updated;
  }

  async cancel(id: string, reason: string | null | undefined, actor: ActorContext): Promise<UserPassDto> {
    const pass = await this.requirePass(id);
    if (pass.status === "CANCELLED") throw BadRequest("Pass is already cancelled");
    const updated = await this.setStatus(id, "CANCELLED");
    await this.audit(actor, AuditAction.PASS_CANCELLED, id, { status: pass.status }, { status: "CANCELLED", reason: reason ?? null });
    return updated;
  }

  /** Extends a pass's validity (works for active or expired passes). */
  async renew(
    id: string,
    durationValue: number | undefined,
    actor: ActorContext,
  ): Promise<UserPassDto> {
    const pass = await this.prisma.userPass.findUnique({
      where: { id },
      include: { passType: true },
    });
    if (!pass) throw NotFound("Pass not found");
    if (pass.status === "CANCELLED") throw BadRequest("Cancelled passes cannot be renewed");
    // An entry-limited pass with no entries left is spent — a new pass should be
    // sold rather than renewing this one.
    if (pass.passType.entryType === "LIMITED" && (pass.remainingEntries ?? 0) <= 0) {
      throw BadRequest("This pass has no entries left — issue a new pass instead of renewing.");
    }

    const now = new Date();
    // Extend from the current expiry if still valid, otherwise from now.
    const base = pass.expiryTime.getTime() > now.getTime() ? pass.expiryTime : now;
    const value = durationValue ?? pass.passType.durationValue;
    const newExpiry = addDuration(base, pass.passType.durationType, value);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.passRenewal.create({
        data: {
          userPassId: id,
          previousExpiryTime: pass.expiryTime,
          newExpiryTime: newExpiry,
          renewedBy: actor.userId,
        },
      });
      return tx.userPass.update({
        where: { id },
        data: {
          expiryTime: newExpiry,
          status: "ACTIVE",
          // Renewal refills entries for limited passes.
          remainingEntries:
            pass.passType.entryType === "LIMITED" ? pass.passType.allowedEntries : null,
        },
        include: userPassInclude,
      });
    });

    await this.audit(
      actor,
      AuditAction.PASS_RENEWED,
      id,
      { expiryTime: pass.expiryTime },
      { expiryTime: newExpiry },
    );
    return toUserPassDto(updated);
  }

  /** Records an entry: validates the pass, logs it, and decrements entries. */
  async entry(id: string, remarks: string | null | undefined): Promise<UserPassDetailDto> {
    // Settle any lapsed validity first so an expired pass is rejected cleanly.
    await this.expireStale(id);
    const pass = await this.requirePass(id);
    const check = validatePassForEntry(pass);
    if (!check.ok) throw BadRequest(check.reason ?? "Pass cannot be used");

    await this.prisma.$transaction(async (tx) => {
      await tx.passUsageLog.create({
        data: { userPassId: id, userId: pass.userId, remarks: remarks ?? null },
      });
      if (pass.remainingEntries !== null) {
        await tx.userPass.update({
          where: { id },
          data: { remainingEntries: { decrement: 1 } },
        });
      }
    });
    return this.getById(id);
  }

  /** Records an exit by closing the latest open entry log. */
  async exit(id: string, remarks: string | null | undefined): Promise<UserPassDetailDto> {
    await this.requirePass(id);
    const open = await this.prisma.passUsageLog.findFirst({
      where: { userPassId: id, exitTime: null },
      orderBy: { entryTime: "desc" },
    });
    if (!open) throw BadRequest("No open entry to close for this pass");

    await this.prisma.passUsageLog.update({
      where: { id: open.id },
      data: {
        exitTime: new Date(),
        ...(remarks ? { remarks } : {}),
      },
    });
    return this.getById(id);
  }

  // --- helpers -------------------------------------------------------------

  /**
   * Flips ACTIVE passes whose validity window has elapsed to EXPIRED so reads
   * reflect expiry the moment it happens, rather than waiting for the daily
   * sweep. Scope to a single pass when an id is given (the detail path).
   */
  private async expireStale(id?: string): Promise<void> {
    await this.prisma.userPass.updateMany({
      where: {
        ...(id ? { id } : {}),
        status: "ACTIVE",
        expiryTime: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });
  }

  private async requirePass(id: string) {
    const pass = await this.prisma.userPass.findUnique({ where: { id } });
    if (!pass) throw NotFound("Pass not found");
    return pass;
  }

  private async setStatus(id: string, status: "SUSPENDED" | "CANCELLED" | "ACTIVE"): Promise<UserPassDto> {
    const updated = await this.prisma.userPass.update({
      where: { id },
      data: { status },
      include: userPassInclude,
    });
    return toUserPassDto(updated);
  }

  private async audit(
    actor: ActorContext,
    action: AuditActionType,
    recordId: string,
    oldData: unknown,
    newData: unknown,
  ): Promise<void> {
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action,
      module: MODULE,
      recordId,
      oldData,
      newData,
      ipAddress: actor.ip,
    });
  }
}
