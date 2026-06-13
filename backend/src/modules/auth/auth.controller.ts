import type { FastifyRequest } from "fastify";
import type { ActorContext } from "../users/users.service.js";
import type { AuthService } from "./auth.service.js";
import type { TwoFactorService } from "./twofactor.service.js";
import type {
  ChangePasswordInput,
  LoginInput,
  RefreshInput,
  ResetPasswordInput,
} from "./auth.types.js";

type TwoFactorCodeBody = { code: string };
type TwoFactorLoginBody = { mfaToken: string; code: string };

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createAuthController(service: AuthService, twoFactor: TwoFactorService) {
  return {
    login: async (request: FastifyRequest<{ Body: LoginInput }>) => {
      return { data: await service.login(request.body, actorOf(request)) };
    },

    refresh: async (request: FastifyRequest<{ Body: RefreshInput }>) => {
      return { data: await service.refresh(request.body.refreshToken) };
    },

    logout: async (request: FastifyRequest) => {
      await service.logout(actorOf(request));
      return { data: { message: "Logged out" } };
    },

    logoutAll: async (request: FastifyRequest) => {
      await service.logoutAll(request.currentUser!.id, actorOf(request));
      return { data: { message: "Logged out from all devices" } };
    },

    forgotPassword: async (request: FastifyRequest<{ Body: { identifier: string } }>) => {
      return { data: await service.forgotPassword(request.body.identifier) };
    },

    resetPassword: async (request: FastifyRequest<{ Body: ResetPasswordInput }>) => {
      await service.resetPassword(request.body.token, request.body.newPassword, actorOf(request));
      return { data: { message: "Your password has been reset" } };
    },

    changePassword: async (request: FastifyRequest<{ Body: ChangePasswordInput }>) => {
      await service.changePassword(request.currentUser!.id, request.body, actorOf(request));
      return { data: { message: "Your password has been changed" } };
    },

    me: async (request: FastifyRequest) => {
      return { data: await service.me(request.currentUser!.id) };
    },

    // --- Two-factor (TOTP) ---------------------------------------------------
    loginTwoFactor: async (request: FastifyRequest<{ Body: TwoFactorLoginBody }>) => {
      const { mfaToken, code } = request.body;
      return { data: await service.loginTwoFactor(mfaToken, code, actorOf(request)) };
    },

    twoFactorSetup: async (request: FastifyRequest) => {
      return { data: await twoFactor.setup(request.currentUser!.id) };
    },

    twoFactorEnable: async (request: FastifyRequest<{ Body: TwoFactorCodeBody }>) => {
      const recoveryCodes = await twoFactor.enable(
        request.currentUser!.id,
        request.body.code,
        actorOf(request),
      );
      return { data: { message: "Two-factor authentication enabled", recoveryCodes } };
    },

    twoFactorDisable: async (request: FastifyRequest<{ Body: TwoFactorCodeBody }>) => {
      await twoFactor.disable(request.currentUser!.id, request.body.code, actorOf(request));
      return { data: { message: "Two-factor authentication disabled" } };
    },

    twoFactorRecoveryStatus: async (request: FastifyRequest) => {
      return { data: await twoFactor.recoveryCodeStatus(request.currentUser!.id) };
    },

    twoFactorRegenerateRecoveryCodes: async (
      request: FastifyRequest<{ Body: TwoFactorCodeBody }>,
    ) => {
      const recoveryCodes = await twoFactor.regenerateRecoveryCodes(
        request.currentUser!.id,
        request.body.code,
        actorOf(request),
      );
      return { data: { message: "Recovery codes regenerated", recoveryCodes } };
    },
  };
}
