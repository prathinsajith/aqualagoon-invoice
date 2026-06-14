"use client";

import { useEffect } from "react";
import Link from "next/link";
import { IconAlertTriangle, IconRefresh, IconHome } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary for the authenticated app. Catches render/data
 * errors in any page under (root) and offers recovery (retry the segment or go
 * home) instead of crashing the whole shell.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces to the browser console / error reporting; not user-facing.
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
          <IconAlertTriangle className="size-7" />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            This page hit an unexpected error. You can retry, or head back to your dashboard.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={reset}>
            <IconRefresh className="size-4" /> Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <IconHome className="size-4" /> Go to dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
