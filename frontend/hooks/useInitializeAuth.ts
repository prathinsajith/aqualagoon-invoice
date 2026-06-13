"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { AuthService } from "@/services/auth-service";

/**
 * On app mount the in-memory access token is gone, so attempt a silent refresh
 * (using the HTTP-only cookie) and re-fetch the current user. `isInitializing`
 * is flipped off when this resolves so the UI can avoid flashing logged-out
 * states for an already-authenticated user.
 */
export const useInitializeAuth = (): void => {
    const setUser = useAuthStore((state) => state.setUser);
    const setToken = useAuthStore((state) => state.setToken);
    const setInitializing = useAuthStore((state) => state.setInitializing);

    useEffect(() => {
        const init = async (): Promise<void> => {
            try {
                // Just signed in (token + user already in memory): skip the silent
                // refresh + /me round-trip so the dashboard renders immediately.
                if (useAuthStore.getState().accessToken) {
                    setInitializing(false);
                    return;
                }

                const refreshRes = await fetch("/api/auth/refresh", {
                    method: "POST",
                    credentials: "include",
                });
                if (!refreshRes.ok) return;

                const { token } = await refreshRes.json();
                setToken(token);

                const user = await AuthService.me();
                setUser(user);
            } catch (err) {
                console.error("Auth init failed:", err);
            } finally {
                setInitializing(false);
            }
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};
