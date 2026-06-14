"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PassTypeService } from "@/services/pass-type-service";
import type { PassTypeListParams, PassTypePayload } from "@/services/pass-type-service";

const passTypeKeys = {
    all: ["pass-types"] as const,
    list: (params: PassTypeListParams) => ["pass-types", "list", params] as const,
    detail: (id: string) => ["pass-types", "detail", id] as const,
};

export function usePassTypes(params: PassTypeListParams) {
    return useQuery({
        queryKey: passTypeKeys.list(params),
        queryFn: () => PassTypeService.list(params),
        placeholderData: keepPreviousData,
    });
}

export function usePassTypeMutations() {
    const qc = useQueryClient();

    const create = useMutation({
        mutationFn: (payload: PassTypePayload) => PassTypeService.create(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: passTypeKeys.all }),
    });
    const update = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<PassTypePayload> }) =>
            PassTypeService.update(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: passTypeKeys.all }),
    });
    const remove = useMutation({
        mutationFn: (id: string) => PassTypeService.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: passTypeKeys.all }),
    });

    return { create, update, remove };
}
