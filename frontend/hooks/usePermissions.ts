"use client";

import { useAuthStore } from "@/stores/auth-store";

/**
 * Permission helpers derived from the current user. Re-renders when the user
 * (and therefore their permission set) changes.
 */
export function usePermissions() {
    const user = useAuthStore((state) => state.user);
    const permissions = user?.permissions ?? [];

    return {
        permissions,
        can: (permission: string): boolean => permissions.includes(permission),
        canAny: (required: string[]): boolean =>
            required.length === 0 || required.some((p) => permissions.includes(p)),
        canAll: (required: string[]): boolean => required.every((p) => permissions.includes(p)),
    };
}
