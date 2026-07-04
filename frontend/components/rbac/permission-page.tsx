"use client";

import { useAuthStore } from "@/stores/auth-store";
import { usePermissions } from "@/hooks/usePermissions";
import { ListPageSkeleton } from "@/components/skeletons";
import { NoAccess } from "@/components/rbac/no-access";

/**
 * Wraps a protected page: waits for the initial auth check, then renders the
 * children only if the user holds the required permission (otherwise NoAccess).
 */
export function PermissionPage({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const { can } = usePermissions();

  if (isInitializing) {
    return <ListPageSkeleton />;
  }

  if (!can(permission)) return <NoAccess />;

  return <>{children}</>;
}
