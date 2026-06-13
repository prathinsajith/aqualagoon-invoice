import { z } from "zod";
import { userStatusSchema } from "../users/users.schema.js";

/** Authenticated principal returned by login and `/auth/me`. */
export const authUserSchema = z.object({
  id: z.string(),
  userCode: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  photoUrl: z.string().nullable(),
  status: userStatusSchema,
  twoFactorEnabled: z.boolean(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});

export const tokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  /** Access-token lifetime in seconds. */
  expiresIn: z.number().int(),
});

export const loginBody = z.object({
  // Email or phone number.
  identifier: z.string().trim().min(3).max(255),
  password: z.string().min(1).max(128),
});

export const refreshBody = z.object({
  refreshToken: z.string().min(10),
});

export const forgotPasswordBody = z.object({
  identifier: z.string().trim().min(3).max(255),
});

export const resetPasswordBody = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8).max(128),
});

export const changePasswordBody = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

// --- Two-factor (TOTP) ------------------------------------------------------
export const twoFactorCodeBody = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const twoFactorLoginBody = z.object({
  mfaToken: z.string().min(10),
  // Either a 6-digit authenticator code or a recovery code (e.g. "ABCDE-FGHJK").
  code: z.string().trim().min(6).max(32),
});

export const twoFactorSetupResponse = z.object({
  data: z.object({
    otpauthUrl: z.string(),
    qrCode: z.string(),
    secret: z.string(),
  }),
});

/** Returned by enable + regenerate — the recovery codes, shown only once. */
export const recoveryCodesResponse = z.object({
  data: z.object({
    message: z.string(),
    recoveryCodes: z.array(z.string()),
  }),
});

export const recoveryStatusResponse = z.object({
  data: z.object({
    total: z.number().int(),
    remaining: z.number().int(),
  }),
});

// --- response envelopes -----------------------------------------------------

export const loginResponse = z.object({
  data: z.object({
    // When 2FA is enabled, only these two are returned (code step follows).
    twoFactorRequired: z.boolean().optional(),
    mfaToken: z.string().optional(),
    // Otherwise the full session is returned.
    user: authUserSchema.optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    expiresIn: z.number().int().optional(),
  }),
});

export const tokensResponse = z.object({ data: tokensSchema });
export const meResponse = z.object({ data: authUserSchema });
export const messageResponse = z.object({ data: z.object({ message: z.string() }) });
export const forgotResponse = z.object({
  data: z.object({
    message: z.string(),
    // Returned only in non-production so the flow is testable without a mailer.
    resetToken: z.string().optional(),
  }),
});
