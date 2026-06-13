'use client';
import { create } from "zustand";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

/** The authenticated principal, as returned by the backend `/auth/me`. */
export interface User {
    id: string;
    userCode: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    photoUrl: string | null;
    status: UserStatus;
    twoFactorEnabled: boolean;
    roles: string[];
    /** Flattened permission names (e.g. "user.create") used for UI gating. */
    permissions: string[];
}

interface AuthState {
    accessToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
    /** True until the initial token-refresh attempt resolves on app load. */
    isInitializing: boolean;
    setToken: (token: string | null) => void;
    setUser: (user: User | null) => void;
    setInitializing: (value: boolean) => void;
    /** Reads the current state — safe to call from event handlers. */
    hasPermission: (permission: string) => boolean;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    accessToken: null,
    user: null,
    isAuthenticated: false,
    isInitializing: true,

    setToken: (token): void =>
        set({
            accessToken: token,
            isAuthenticated: !!token,
        }),

    setUser: (user): void => set({ user }),

    setInitializing: (value): void => set({ isInitializing: value }),

    hasPermission: (permission): boolean => {
        const { user } = get();
        return user?.permissions.includes(permission) ?? false;
    },

    logout: async (): Promise<void> => {
        // Clear auth state immediately.
        set({ accessToken: null, user: null, isAuthenticated: false });

        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
        } catch (err) {
            console.error("Logout error:", err);
        }

        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
    },
}));

/** Full display name helper. */
export const fullName = (user: Pick<User, "firstName" | "lastName"> | null): string =>
    user ? `${user.firstName} ${user.lastName}`.trim() : "";
