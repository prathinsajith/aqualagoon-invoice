"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider, keepPreviousData } from "@tanstack/react-query";

/**
 * Provides a per-browser-session React Query client. Created in state so it is
 * stable across re-renders but never shared between requests on the server.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Treat data as fresh for a minute so in-app navigation doesn't
            // refetch on every mount; keep it cached for 10m after unmount.
            staleTime: 60_000,
            gcTime: 10 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
            // Keep showing the previous page/filter's data while the next loads
            // — eliminates the blank-flicker on pagination and filter changes.
            placeholderData: keepPreviousData,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
