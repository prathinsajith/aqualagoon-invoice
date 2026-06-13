import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { env } from "../../config/env.js";
import { commonErrors } from "../../lib/response.js";
import { AuthService } from "./auth.service.js";
import { TwoFactorService } from "./twofactor.service.js";
import { createAuthController } from "./auth.controller.js";
import {
  changePasswordBody,
  forgotPasswordBody,
  forgotResponse,
  loginBody,
  loginResponse,
  meResponse,
  messageResponse,
  recoveryCodesResponse,
  recoveryStatusResponse,
  refreshBody,
  resetPasswordBody,
  tokensResponse,
  twoFactorCodeBody,
  twoFactorLoginBody,
  twoFactorSetupResponse,
} from "./auth.schema.js";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createAuthController(
    new AuthService(app.prisma),
    new TwoFactorService(app.prisma),
  );

  const tags = ["auth"];
  const security = [{ bearerAuth: [] }];
  // Throttle credential endpoints (login + forgot-password) against brute force.
  const credentialRateLimit = {
    rateLimit: { max: env.LOGIN_RATE_MAX, timeWindow: env.LOGIN_RATE_WINDOW },
  };

  r.post(
    "/auth/login",
    {
      config: credentialRateLimit,
      schema: {
        tags,
        summary: "Log in with email or phone + password",
        body: loginBody,
        response: { 200: loginResponse, ...commonErrors },
      },
    },
    controller.login,
  );

  r.post(
    "/auth/refresh",
    {
      schema: {
        tags,
        summary: "Exchange a refresh token for a new token pair",
        body: refreshBody,
        response: { 200: tokensResponse, ...commonErrors },
      },
    },
    controller.refresh,
  );

  r.post(
    "/auth/forgot-password",
    {
      config: credentialRateLimit,
      schema: {
        tags,
        summary: "Request a password reset token",
        body: forgotPasswordBody,
        response: { 200: forgotResponse, ...commonErrors },
      },
    },
    controller.forgotPassword,
  );

  r.post(
    "/auth/reset-password",
    {
      schema: {
        tags,
        summary: "Reset a password using a reset token",
        body: resetPasswordBody,
        response: { 200: messageResponse, ...commonErrors },
      },
    },
    controller.resetPassword,
  );

  r.post(
    "/auth/change-password",
    {
      preHandler: [app.authenticate],
      schema: {
        tags,
        summary: "Change the current user's password",
        security,
        body: changePasswordBody,
        response: { 200: messageResponse, ...commonErrors },
      },
    },
    controller.changePassword,
  );

  r.post(
    "/auth/logout",
    {
      preHandler: [app.authenticate],
      schema: {
        tags,
        summary: "Log out the current session",
        security,
        response: { 200: messageResponse, ...commonErrors },
      },
    },
    controller.logout,
  );

  r.post(
    "/auth/logout-all",
    {
      preHandler: [app.authenticate],
      schema: {
        tags,
        summary: "Log out of all devices (invalidate every token)",
        security,
        response: { 200: messageResponse, ...commonErrors },
      },
    },
    controller.logoutAll,
  );

  r.get(
    "/auth/me",
    {
      preHandler: [app.authenticate],
      schema: {
        tags,
        summary: "Get the current authenticated user",
        security,
        response: { 200: meResponse, ...commonErrors },
      },
    },
    controller.me,
  );

  // --- Two-factor authentication (TOTP) -------------------------------------
  const twoFactorTags = ["auth-2fa"];

  r.post(
    "/auth/2fa/login",
    {
      config: credentialRateLimit,
      schema: {
        tags: twoFactorTags,
        summary: "Complete login with a TOTP code",
        body: twoFactorLoginBody,
        response: { 200: loginResponse, ...commonErrors },
      },
    },
    controller.loginTwoFactor,
  );

  r.post(
    "/auth/2fa/setup",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: twoFactorTags,
        summary: "Begin 2FA enrolment — returns a secret + QR code",
        security,
        response: { 200: twoFactorSetupResponse, ...commonErrors },
      },
    },
    controller.twoFactorSetup,
  );

  r.post(
    "/auth/2fa/enable",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: twoFactorTags,
        summary: "Verify a code, enable 2FA, and return recovery codes",
        security,
        body: twoFactorCodeBody,
        response: { 200: recoveryCodesResponse, ...commonErrors },
      },
    },
    controller.twoFactorEnable,
  );

  r.post(
    "/auth/2fa/disable",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: twoFactorTags,
        summary: "Verify a code and disable 2FA",
        security,
        body: twoFactorCodeBody,
        response: { 200: messageResponse, ...commonErrors },
      },
    },
    controller.twoFactorDisable,
  );

  r.get(
    "/auth/2fa/recovery-codes",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: twoFactorTags,
        summary: "How many recovery codes remain",
        security,
        response: { 200: recoveryStatusResponse, ...commonErrors },
      },
    },
    controller.twoFactorRecoveryStatus,
  );

  r.post(
    "/auth/2fa/recovery-codes",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: twoFactorTags,
        summary: "Verify a code and regenerate recovery codes",
        security,
        body: twoFactorCodeBody,
        response: { 200: recoveryCodesResponse, ...commonErrors },
      },
    },
    controller.twoFactorRegenerateRecoveryCodes,
  );
}
