"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GalleryService } from "@/services/gallery-service";
import type {
    GalleryCreatePayload,
    GalleryListParams,
    GalleryUpdatePayload,
} from "@/services/gallery-service";

export const galleryKeys = {
    all: ["gallery"] as const,
    list: (params: GalleryListParams) => ["gallery", "list", params] as const,
};

export function useGallery(params: GalleryListParams) {
    return useQuery({
        queryKey: galleryKeys.list(params),
        queryFn: () => GalleryService.list(params),
        placeholderData: keepPreviousData,
    });
}

export function useGalleryMutations() {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: galleryKeys.all });

    const create = useMutation({
        mutationFn: (payload: GalleryCreatePayload) => GalleryService.create(payload),
        onSuccess: invalidate,
    });
    const update = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: GalleryUpdatePayload }) =>
            GalleryService.update(id, payload),
        onSuccess: invalidate,
    });
    const remove = useMutation({
        mutationFn: (id: string) => GalleryService.remove(id),
        onSuccess: invalidate,
    });

    return { create, update, remove };
}
