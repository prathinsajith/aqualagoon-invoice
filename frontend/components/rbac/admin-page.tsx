"use client";

import { redirect } from "next/navigation";

import { useAuthStore } from "@/stores/auth-store";
import { usePermissions } from "@/hooks/usePermissions";
import { Spinner } from "@/components/ui/spinner";

/**
 * Wraps an admin-only page: waits for the initial auth check, then renders the
 * children only for admins. Non-admins are sent to the first area they can
 * actually use (so the app home stays usable for every role). The redirect runs
 * during render via Next's `redirect()` rather than a post-render effect.
 */
export function AdminPage({ children }: { children: React.ReactNode }) {
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const { isAdmin, can } = usePermissions();

  // Hold the gate until the in-memory session has been restored.
  if (isInitializing) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!isAdmin) {
    const landing = can("invoice.view")
      ? "/invoices"
      : can("pass.view")
        ? "/passes"
        : can("user.view")
          ? "/users"
          : "/profile";
    redirect(landing);
  }

  return <>{children}</>;
}
