import type { PrismaClient } from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";
import { hashPassword, verifyPassword, needsRehash } from "../../lib/password.js";
import {
  signAccessToken,
  signMfaToken,
  signRefreshToken,
  signResetToken,
  verifyMfaToken,
  verifyRefreshToken,
  verifyResetToken,
} from "../../lib/tokens.js";
import { verifyToken as verifyTotp } from "../../lib/totp.js";
import { decryptSecret } from "../../lib/crypto.js";
import { hashRecoveryCode, matchRecoveryCode } from "../../lib/recovery-codes.js";
import { sendMail } from "../../lib/mail/mailer.js";
import { passwordResetEmail } from "../../lib/mail/templates.js";
import { loadMailBranding } from "../../lib/mail/branding.js";
import { BadRequest, Forbidden, Unauthorized } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { ActorContext } from "../users/users.service.js";
import { AuthRepository } from "./auth.repository.js";
import { toAuthUserDto } from "./auth.types.js";
import type {
  AuthUser,
  AuthUserDto,
  ChangePasswordInput,
  LoginInput,
} from "./auth.types.js";

const MODULE = "auth";

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResult extends IssuedTokens {
  user: AuthUserDto;
}

/** Returned by `login` when the account has 2FA — the code step must follow. */
export interface TwoFactorChallenge {
  twoFactorRequired: true;
  mfaToken: string;
}

export class AuthService {
  private readonly repo: AuthRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new AuthRepository(prisma);
  }

  async login(
    input: LoginInput,
    actor: ActorContext,
  ): Promise<LoginResult | TwoFactorChallenge> {
    const user = await this.repo.findByIdentifier(input.identifier);
    // Same error whether the user is missing or the password is wrong.
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw Unauthorized("Invalid credentials");
    }
    if (user.status !== "ACTIVE") throw Forbidden("Your account is not active");

    // Transparently upgrade legacy/high-cost hashes to the current params so
    // the next login is faster. Best-effort — don't block or fail the login.
    if (needsRehash(user.passwordHash)) {
      void hashPassword(input.password)
        .then((hash) => this.repo.updatePassword(user.id, hash, false))
        .catch(() => {});
    }

    // Password verified — if 2FA is on, hand back a short-lived MFA token and
    // require the authenticator code before issuing a real session.
    if (user.totpEnabled) {
      const { token } = await signMfaToken(user.id, user.tokenVersion);
      return { twoFactorRequired: true, mfaToken: token };
    }

    await this.repo.updateLastLogin(user.id);
    const tokens = await this.issueTokens(user);

    await writeAudit(this.prisma, {
      userId: user.id,
      action: AuditAction.LOGIN,
      module: MODULE,
      recordId: user.id,
      ipAddress: actor.ip,
    });

    return { user: toAuthUserDto(user), ...tokens };
  }

  /**
   * Completes login for a 2FA account. Accepts either a 6-digit authenticator
   * code or a single-use recovery code (which is consumed on success).
   */
  async loginTwoFactor(mfaToken: string, code: string, actor: ActorContext): Promise<LoginResult> {
    const payload = await verifyMfaToken(mfaToken);
    const user = await this.repo.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.ver) {
      throw Unauthorized("Your sign-in session expired, please try again");
    }
    if (user.status !== "ACTIVE") throw Forbidden("Your account is not active");
    if (!user.totpEnabled || !user.totpSecret) {
      throw BadRequest("Two-factor authentication is not enabled");
    }

    // A 6-digit value is an authenticator code; anything else is a recovery code.
    const isTotp = /^\d{6}$/.test(code.trim());
    const method = isTotp ? "totp" : "recovery";
    const ok = isTotp
      ? verifyTotp(code.trim(), decryptSecret(user.totpSecret))
      : await this.consumeRecoveryCode(user.id, code);
    if (!ok) {
      throw Unauthorized(isTotp ? "Invalid authentication code" : "Invalid or used recovery code");
    }

    await this.repo.updateLastLogin(user.id);
    const tokens = await this.issueTokens(user);

    await writeAudit(this.prisma, {
      userId: user.id,
      action: AuditAction.LOGIN,
      module: MODULE,
      recordId: user.id,
      newData: { method: `2fa:${method}` },
      ipAddress: actor.ip,
    });

    return { user: toAuthUserDto(user), ...tokens };
  }

  /** Marks a matching unused recovery code as spent. Returns false if none match. */
  private async consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
    const candidate = hashRecoveryCode(code);
    const stored = await this.repo.findUnusedRecoveryCodes(userId);
    const hit = stored.find((c) => matchRecoveryCode(candidate, c.codeHash));
    if (!hit) return false;
    await this.repo.markRecoveryCodeUsed(hit.id);
    return true;
  }

  async refresh(refreshToken: string): Promise<IssuedTokens> {
    const payload = await verifyRefreshToken(refreshToken);
    const user = await this.repo.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.ver) {
      throw Unauthorized("Refresh token is no longer valid");
    }
    if (user.status !== "ACTIVE") throw Forbidden("Your account is not active");
    return this.issueTokens(user);
  }

  async logout(actor: ActorContext): Promise<void> {
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.LOGOUT,
      module: MODULE,
      recordId: actor.userId,
      ipAddress: actor.ip,
    });
  }

  async logoutAll(userId: string, actor: ActorContext): Promise<void> {
    await this.repo.bumpTokenVersion(userId);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.LOGOUT_ALL,
      module: MODULE,
      recordId: userId,
      ipAddress: actor.ip,
    });
  }

  /**
   * Generates a password-reset token and emails the reset link. Always returns a
   * generic message so the endpoint can't be used to probe which identifiers
   * exist. When no mailer is configured (dev), the token is also returned so the
   * flow stays testable.
   */
  async forgotPassword(identifier: string): Promise<{ message: string; resetToken?: string }> {
    const message = "If an account matches, password reset instructions have been sent.";
    const user = await this.repo.findByIdentifier(identifier);
    // No account, or a customer account with no email to send to.
    if (!user || !user.email) return { message };

    const { token } = await signResetToken(user.id, user.tokenVersion);
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;

    const brand = await loadMailBranding(this.prisma);
    const mail = passwordResetEmail(brand, {
      name: user.firstName,
      resetUrl,
      ttl: env.JWT_RESET_TTL,
    });
    await sendMail({ ...mail, to: user.email });

    // Without a configured mailer, hand back the token so dev can still test.
    return env.mailEnabled ? { message } : { message, resetToken: token };
  }

  async resetPassword(token: string, newPassword: string, actor: ActorContext): Promise<void> {
    const payload = await verifyResetToken(token);
    const creds = await this.repo.findCredentialsById(payload.sub);
    // A version mismatch means the token was already consumed or superseded.
    if (!creds || creds.tokenVersion !== payload.ver) {
      throw Unauthorized("This reset link is invalid or has already been used");
    }

    // Bump the token version: invalidates this reset token and every session.
    await this.repo.updatePassword(payload.sub, await hashPassword(newPassword), true);
    await writeAudit(this.prisma, {
      userId: payload.sub,
      action: AuditAction.PASSWORD_RESET,
      module: MODULE,
      recordId: payload.sub,
      ipAddress: actor.ip,
    });
  }

  async changePassword(
    userId: string,
    input: ChangePasswordInput,
    actor: ActorContext,
  ): Promise<void> {
    const creds = await this.repo.findCredentialsById(userId);
    if (!creds) throw Unauthorized();
    if (!(await verifyPassword(input.currentPassword, creds.passwordHash))) {
      throw BadRequest("Current password is incorrect");
    }

    // Keep the current session valid (no version bump) — use logout-all to
    // revoke other devices explicitly.
    await this.repo.updatePassword(userId, await hashPassword(input.newPassword), false);
    await writeAudit(this.prisma, {
      userId,
      action: AuditAction.PASSWORD_CHANGE,
      module: MODULE,
      recordId: userId,
      ipAddress: actor.ip,
    });
  }

  async me(userId: string): Promise<AuthUserDto> {
    const user = await this.repo.findById(userId);
    if (!user) throw Unauthorized();
    return toAuthUserDto(user);
  }

  private async issueTokens(user: AuthUser): Promise<IssuedTokens> {
    const [access, refresh] = await Promise.all([
      signAccessToken(user.id, user.tokenVersion),
      signRefreshToken(user.id, user.tokenVersion),
    ]);
    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      expiresIn: access.expiresIn,
    };
  }
}
