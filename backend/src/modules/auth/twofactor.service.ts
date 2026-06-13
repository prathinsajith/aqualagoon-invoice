import QRCode from "qrcode";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { BadRequest, Conflict, Unauthorized } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import { encryptSecret, decryptSecret } from "../../lib/crypto.js";
import { generateSecret, keyUri, verifyToken } from "../../lib/totp.js";
import { generateRecoveryCodes, hashRecoveryCode } from "../../lib/recovery-codes.js";
import type { ActorContext } from "../users/users.service.js";
import { AuthRepository } from "./auth.repository.js";

const MODULE = "auth";
const DEFAULT_ISSUER = "Aqua Lagoon";

export interface TwoFactorSetup {
  otpauthUrl: string;
  qrCode: string;
  secret: string;
}

export interface RecoveryCodeCounts {
  total: number;
  remaining: number;
}

/** Manages TOTP two-factor enrolment (setup → enable) and removal. */
export class TwoFactorService {
  private readonly repo: AuthRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new AuthRepository(prisma);
  }

  /** Generates a fresh secret + QR for the user to scan (not yet enabled). */
  async setup(userId: string): Promise<TwoFactorSetup> {
    const user = await this.repo.findById(userId);
    if (!user) throw Unauthorized();
    if (user.totpEnabled) throw Conflict("Two-factor authentication is already enabled");

    const secret = generateSecret();
    await this.repo.setTotpSecret(userId, encryptSecret(secret));

    // Issuer is the configured company name so authenticator apps show the
    // tenant's brand; falls back to the product name when unset.
    const company = await this.prisma.companySetting.findFirst().catch(() => null);
    const issuer = company?.name || DEFAULT_ISSUER;

    // Login users always have an email; fall back to the user code just in case.
    const otpauthUrl = keyUri(user.email ?? user.userCode, issuer, secret);
    const qrCode = await QRCode.toDataURL(otpauthUrl);
    return { otpauthUrl, qrCode, secret };
  }

  /**
   * Confirms the user can generate valid codes, then turns 2FA on and issues a
   * fresh set of single-use recovery codes (returned in plaintext exactly once).
   */
  async enable(userId: string, code: string, actor: ActorContext): Promise<string[]> {
    const user = await this.repo.findById(userId);
    if (!user) throw Unauthorized();
    if (user.totpEnabled) throw Conflict("Two-factor authentication is already enabled");
    if (!user.totpSecret) throw BadRequest("Start two-factor setup first");

    if (!verifyToken(code, decryptSecret(user.totpSecret))) {
      throw BadRequest("Invalid authentication code");
    }

    await this.repo.enableTotp(userId);
    const recoveryCodes = await this.issueRecoveryCodes(userId);
    await writeAudit(this.prisma, {
      userId,
      action: AuditAction.TWO_FACTOR_ENABLED,
      module: MODULE,
      recordId: userId,
      ipAddress: actor.ip,
    });
    return recoveryCodes;
  }

  /** Disables 2FA after verifying a current code, and clears recovery codes. */
  async disable(userId: string, code: string, actor: ActorContext): Promise<void> {
    const user = await this.repo.findById(userId);
    if (!user) throw Unauthorized();
    if (!user.totpEnabled || !user.totpSecret) {
      throw BadRequest("Two-factor authentication is not enabled");
    }
    if (!verifyToken(code, decryptSecret(user.totpSecret))) {
      throw BadRequest("Invalid authentication code");
    }

    await this.repo.disableTotp(userId);
    await this.repo.deleteRecoveryCodes(userId);
    await writeAudit(this.prisma, {
      userId,
      action: AuditAction.TWO_FACTOR_DISABLED,
      module: MODULE,
      recordId: userId,
      ipAddress: actor.ip,
    });
  }

  /**
   * Regenerates recovery codes after verifying a current authenticator code.
   * Invalidates every previously issued code and returns the new set once.
   */
  async regenerateRecoveryCodes(
    userId: string,
    code: string,
    actor: ActorContext,
  ): Promise<string[]> {
    const user = await this.repo.findById(userId);
    if (!user) throw Unauthorized();
    if (!user.totpEnabled || !user.totpSecret) {
      throw BadRequest("Two-factor authentication is not enabled");
    }
    if (!verifyToken(code, decryptSecret(user.totpSecret))) {
      throw BadRequest("Invalid authentication code");
    }

    const recoveryCodes = await this.issueRecoveryCodes(userId);
    await writeAudit(this.prisma, {
      userId,
      action: AuditAction.RECOVERY_CODES_REGENERATED,
      module: MODULE,
      recordId: userId,
      ipAddress: actor.ip,
    });
    return recoveryCodes;
  }

  /** How many recovery codes remain (for display in settings). */
  async recoveryCodeStatus(userId: string): Promise<RecoveryCodeCounts> {
    return this.repo.recoveryCodeCounts(userId);
  }

  /** Generates a fresh code set, persisting only their hashes. */
  private async issueRecoveryCodes(userId: string): Promise<string[]> {
    const codes = generateRecoveryCodes();
    await this.repo.replaceRecoveryCodes(userId, codes.map(hashRecoveryCode));
    return codes;
  }
}
