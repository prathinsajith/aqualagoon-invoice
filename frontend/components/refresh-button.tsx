"use client";

import { useState } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { IconRefresh } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Re-fetches a list's data in place (no full-page reload) by invalidating the
 * given React Query key. The icon spins until the refetch settles. Drop it into
 * any list toolbar: `<RefreshButton queryKey={["invoices"]} />`.
 */
export function RefreshButton({
  queryKey,
  className,
}: {
  queryKey: QueryKey;
  className?: string;
}) {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await qc.invalidateQueries({ queryKey });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={refresh}
      disabled={refreshing}
      aria-label="Refresh"
      title="Refresh"
      className={cn("shrink-0", className)}
    >
      <IconRefresh className={cn("size-4", refreshing && "animate-spin")} />
    </Button>
  );
}
