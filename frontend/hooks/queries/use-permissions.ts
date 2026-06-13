"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PermissionService } from "@/services/permission-service";
import { roleKeys } from "./use-roles";

export const permissionKeys = {
    catalog: ["permissions", "catalog"] as const,
    forRole: (roleId: string) => ["permissions", "role", roleId] as const,
};

/** The full permission catalog (rarely changes — cached longer). */
export function usePermissionCatalog() {
    return useQuery({
        queryKey: permissionKeys.catalog,
        queryFn: () => PermissionService.list(),
        staleTime: 5 * 60_000,
    });
}

export function useRolePermissionMutations(roleId: string) {
    const qc = useQueryClient();
    const invalidate = () => {
        qc.invalidateQueries({ queryKey: permissionKeys.forRole(roleId) });
        qc.invalidateQueries({ queryKey: roleKeys.all });
    };

    const assign = useMutation({
        mutationFn: (permissionIds: string[]) => PermissionService.assign(roleId, permissionIds),
        onSuccess: invalidate,
    });
    const revoke = useMutation({
        mutationFn: (permissionId: string) => PermissionService.revoke(roleId, permissionId),
        onSuccess: invalidate,
    });

    return { assign, revoke };
}
