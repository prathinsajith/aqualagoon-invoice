"use client";

import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { RoleService } from "@/services/role-service";
import type { RoleListParams, RolePayload } from "@/services/role-service";

const roleKeys = {
    all: ["roles"] as const,
    list: (params: RoleListParams) => ["roles", "list", params] as const,
    detail: (id: string) => ["roles", "detail", id] as const,
};

export function useRoles(params: RoleListParams = {}) {
    return useQuery({
        queryKey: roleKeys.list(params),
        queryFn: () => RoleService.list(params),
        placeholderData: keepPreviousData,
    });
}

export function useRoleMutations() {
    const qc = useQueryClient();

    const create = useMutation({
        mutationFn: (payload: RolePayload) => RoleService.create(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
    });
    const update = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: RolePayload }) =>
            RoleService.update(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
    });
    const remove = useMutation({
        mutationFn: (id: string) => RoleService.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
    });
    const setAssignableRoles = useMutation({
        mutationFn: ({ id, assignableRoleIds }: { id: string; assignableRoleIds: string[] }) =>
            RoleService.setAssignableRoles(id, assignableRoleIds),
        onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
    });
    const reorder = useMutation({
        mutationFn: (orderedIds: string[]) => RoleService.reorder(orderedIds),
        onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
    });

    return { create, update, remove, setAssignableRoles, reorder };
}
