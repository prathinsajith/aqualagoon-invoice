"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PassService } from "@/services/pass-service";
import type { PassListParams, RenewPayload } from "@/services/pass-service";

const passKeys = {
    all: ["passes"] as const,
    list: (params: PassListParams) => ["passes", "list", params] as const,
    detail: (id: string) => ["passes", "detail", id] as const,
};

export function usePasses(params: PassListParams) {
    return useQuery({
        queryKey: passKeys.list(params),
        queryFn: () => PassService.list(params),
        placeholderData: keepPreviousData,
    });
}

export function usePass(id: string | null) {
    return useQuery({
        queryKey: passKeys.detail(id ?? ""),
        queryFn: () => PassService.get(id!),
        enabled: !!id,
    });
}

export function usePassMutations() {
    const qc = useQueryClient();

    const activate = useMutation({
        mutationFn: (id: string) => PassService.activate(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: passKeys.all }),
    });
    const suspend = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) => PassService.suspend(id, reason),
        onSuccess: () => qc.invalidateQueries({ queryKey: passKeys.all }),
    });
    const cancel = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) => PassService.cancel(id, reason),
        onSuccess: () => qc.invalidateQueries({ queryKey: passKeys.all }),
    });
    const renew = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload?: RenewPayload }) =>
            PassService.renew(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: passKeys.all }),
    });
    const entry = useMutation({
        mutationFn: ({ id, remarks }: { id: string; remarks?: string }) => PassService.entry(id, remarks),
        onSuccess: () => qc.invalidateQueries({ queryKey: passKeys.all }),
    });
    const exit = useMutation({
        mutationFn: ({ id, remarks }: { id: string; remarks?: string }) => PassService.exit(id, remarks),
        onSuccess: () => qc.invalidateQueries({ queryKey: passKeys.all }),
    });

    return { activate, suspend, cancel, renew, entry, exit };
}
