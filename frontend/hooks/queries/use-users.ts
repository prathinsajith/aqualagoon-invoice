"use client";

import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { UserService } from "@/services/user-service";
import type { UserListParams, UserPayload } from "@/services/user-service";

const userKeys = {
    all: ["users"] as const,
    list: (params: UserListParams) => ["users", "list", params] as const,
    detail: (id: string) => ["users", "detail", id] as const,
};

export function useUsers(params: UserListParams) {
    return useQuery({
        queryKey: userKeys.list(params),
        queryFn: () => UserService.list(params),
        placeholderData: keepPreviousData,
    });
}

export function useUserMutations() {
    const qc = useQueryClient();

    const create = useMutation({
        mutationFn: (payload: UserPayload) => UserService.create(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
    });
    const update = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UserPayload }) =>
            UserService.update(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
    });
    const remove = useMutation({
        mutationFn: (id: string) => UserService.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
    });
    const restore = useMutation({
        mutationFn: (id: string) => UserService.restore(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
    });

    return { create, update, remove, restore };
}
