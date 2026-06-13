"use client";

import { useAuthStore } from "@/stores/auth-store";
import { usePermissions } from "@/hooks/usePermissions";
import { Spinner } from "@/components/ui/spinner";
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
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!can(permission)) return <NoAccess />;

  return <>{children}</>;
}
