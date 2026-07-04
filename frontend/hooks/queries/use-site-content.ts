"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteContentService } from "@/services/site-content-service";
import type { SiteContentKey } from "@/types/site-content";

export const siteContentKeys = {
    all: ["site-content"] as const,
};

export function useSiteContent() {
    return useQuery({
        queryKey: siteContentKeys.all,
        queryFn: () => SiteContentService.get(),
    });
}

export function useSiteContentMutations() {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: siteContentKeys.all });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update = useMutation({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mutationFn: ({ key, data }: { key: SiteContentKey; data: any }) =>
            SiteContentService.update(key, data),
        onSuccess: invalidate,
    });

    const uploadImage = useMutation({
        mutationFn: (file: File) => SiteContentService.uploadImage(file),
    });

    return { update, uploadImage };
}
