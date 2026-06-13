import type { PrismaClient } from "../../generated/prisma/client.js";
import { authUserInclude } from "./auth.types.js";
import type { AuthUser } from "./auth.types.js";

export class AuthRepository {
  constructor(private readonly db: PrismaClient) {}

  /** Finds an active (non-archived) user by email or phone. */
  findByIdentifier(identifier: string): Promise<AuthUser | null> {
    return this.db.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: identifier }, { phone: identifier }],
      },
      include: authUserInclude,
    });
  }

  findById(id: string): Promise<AuthUser | null> {
    return this.db.user.findFirst({
      where: { id, deletedAt: null },
      include: authUserInclude,
    });
  }

  /** Loads only the fields needed to verify a password. */
  findCredentialsById(
    id: string,
  ): Promise<{ id: string; passwordHash: string; tokenVersion: number } | null> {
    return this.db.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, passwordHash: true, tokenVersion: true },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.db.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }

  async updatePassword(id: string, passwordHash: string, bumpTokenVersion: boolean): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: {
        passwordHash,
        ...(bumpTokenVersion ? { tokenVersion: { increment: 1 } } : {}),
      },
    });
  }

  async bumpTokenVersion(id: string): Promise<void> {
    await this.db.user.update({ where: { id }, data: { tokenVersion: { increment: 1 } } });
  }

  /** Stores a (pending) encrypted TOTP secret without enabling 2FA yet. */
  async setTotpSecret(id: string, encryptedSecret: string): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: { totpSecret: encryptedSecret, totpEnabled: false },
    });
  }

  async enableTotp(id: string): Promise<void> {
    await this.db.user.update({ where: { id }, data: { totpEnabled: true } });
  }

  async disableTotp(id: string): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: { totpSecret: null, totpEnabled: false },
    });
  }

  // --- Recovery codes --------------------------------------------------------

  /** Atomically replaces a user's recovery codes with a fresh set of hashes. */
  async replaceRecoveryCodes(userId: string, hashes: string[]): Promise<void> {
    await this.db.$transaction([
      this.db.twoFactorRecoveryCode.deleteMany({ where: { userId } }),
      this.db.twoFactorRecoveryCode.createMany({
        data: hashes.map((codeHash) => ({ userId, codeHash })),
      }),
    ]);
  }

  async deleteRecoveryCodes(userId: string): Promise<void> {
    await this.db.twoFactorRecoveryCode.deleteMany({ where: { userId } });
  }

  /** Returns the user's unused recovery codes (id + hash only). */
  findUnusedRecoveryCodes(userId: string): Promise<{ id: string; codeHash: string }[]> {
    return this.db.twoFactorRecoveryCode.findMany({
      where: { userId, usedAt: null },
      select: { id: true, codeHash: true },
    });
  }

  async markRecoveryCodeUsed(id: string): Promise<void> {
    await this.db.twoFactorRecoveryCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  /** Counts a user's total and still-unused recovery codes. */
  async recoveryCodeCounts(userId: string): Promise<{ total: number; remaining: number }> {
    const [total, remaining] = await Promise.all([
      this.db.twoFactorRecoveryCode.count({ where: { userId } }),
      this.db.twoFactorRecoveryCode.count({ where: { userId, usedAt: null } }),
    ]);
    return { total, remaining };
  }
}
