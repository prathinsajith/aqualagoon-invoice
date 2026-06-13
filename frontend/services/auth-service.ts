import { api } from "@/lib/axios";
import type { User } from "@/stores/auth-store";
import type {
    AuthResult,
    LoginResult,
    RecoveryCodesResult,
    RecoveryCodesStatus,
    TwoFactorSetup,
} from "@/types/rbac";

/** Type guard: did login return a 2FA challenge instead of a session? */
export function isTwoFactorChallenge(
    result: LoginResult,
): result is { twoFactorRequired: true; mfaToken: string } {
    return "twoFactorRequired" in result && result.twoFactorRequired === true;
}

/** Calls to the backend auth module (via the shared axios instance). */
export const AuthService = {
    login: async (identifier: string, password: string): Promise<LoginResult> => {
        const res = await api.post("/api/auth/login", { identifier, password });
        return res.data.data;
    },

    loginTwoFactor: async (mfaToken: string, code: string): Promise<AuthResult> => {
        const res = await api.post("/api/auth/2fa/login", { mfaToken, code });
        return res.data.data;
    },

    setupTwoFactor: async (): Promise<TwoFactorSetup> => {
        const res = await api.post("/api/auth/2fa/setup");
        return res.data.data;
    },

    enableTwoFactor: async (code: string): Promise<RecoveryCodesResult> => {
        const res = await api.post("/api/auth/2fa/enable", { code });
        return res.data.data;
    },

    disableTwoFactor: async (code: string): Promise<void> => {
        await api.post("/api/auth/2fa/disable", { code });
    },

    recoveryCodesStatus: async (): Promise<RecoveryCodesStatus> => {
        const res = await api.get("/api/auth/2fa/recovery-codes");
        return res.data.data;
    },

    regenerateRecoveryCodes: async (code: string): Promise<RecoveryCodesResult> => {
        const res = await api.post("/api/auth/2fa/recovery-codes", { code });
        return res.data.data;
    },

    me: async (): Promise<User> => {
        const res = await api.get("/api/auth/me");
        return res.data.data;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        await api.post("/api/auth/change-password", { currentPassword, newPassword });
    },

    forgotPassword: async (
        identifier: string,
    ): Promise<{ message: string; resetToken?: string }> => {
        const res = await api.post("/api/auth/forgot-password", { identifier });
        return res.data.data;
    },

    resetPassword: async (token: string, newPassword: string): Promise<void> => {
        await api.post("/api/auth/reset-password", { token, newPassword });
    },

    logoutAll: async (): Promise<void> => {
        await api.post("/api/auth/logout-all");
    },
};
