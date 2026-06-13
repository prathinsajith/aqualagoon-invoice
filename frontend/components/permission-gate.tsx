"use client";

import { usePermissions } from "@/hooks/usePermissions";

interface CanProps {
    /** Single permission required to render the children. */
    permission?: string;
    /** Render if the user has ANY of these permissions. */
    anyOf?: string[];
    children: React.ReactNode;
    /** Rendered when the user lacks the permission (defaults to nothing). */
    fallback?: React.ReactNode;
}

/**
 * Permission-driven render gate. Hides UI the current user isn't allowed to use.
 * Authorization is still enforced server-side — this is purely for UX.
 */
export function Can({ permission, anyOf, children, fallback = null }: CanProps) {
    const { can, canAny } = usePermissions();
    const allowed = permission ? can(permission) : anyOf ? canAny(anyOf) : true;
    return <>{allowed ? children : fallback}</>;
}
