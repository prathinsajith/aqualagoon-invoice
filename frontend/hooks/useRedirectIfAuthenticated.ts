"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { AuthService } from "@/services/auth-service";

/**
 * Custom hook to redirect logged-in users away from login/signup pages.
 */
export const useRedirectIfAuthenticated = () => {
    const router = useRouter();
    const { setToken, setUser, accessToken } = useAuthStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            // If accessToken already exists in store, redirect immediately
            if (accessToken) {
                router.replace("/dashboard");
                setLoading(false);
                return;
            }

            try {
                const res = await fetch("/api/auth/refresh", {
                    method: "POST",
                    credentials: "include", // send refresh token cookie
                });

                if (res.ok) {
                    const data = await res.json();

                    if (data?.token) {
                        setToken(data.token);

                        // Fetch the current user after the silent refresh.
                        try {
                            const user = await AuthService.me();
                            setUser(user);
                        } catch {
                            // Non-fatal — still send them to the dashboard.
                        }

                        router.replace("/dashboard");
                    }
                }
            } catch {
                console.log("No valid session. User stays on login page.");
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, [router, accessToken, setToken, setUser]);

    return loading;
};
