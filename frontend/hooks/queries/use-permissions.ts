"use client";

import { useQuery } from "@tanstack/react-query";
import { PermissionService } from "@/services/permission-service";

const permissionKeys = {
    catalog: ["permissions", "catalog"] as const,
};

/** The full permission catalog (rarely changes — cached longer). */
export function usePermissionCatalog() {
    return useQuery({
        queryKey: permissionKeys.catalog,
        queryFn: () => PermissionService.list(),
        staleTime: 5 * 60_000,
    });
}
