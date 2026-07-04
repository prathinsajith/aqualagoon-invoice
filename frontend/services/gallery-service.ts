import { api } from "@/lib/axios";
import type { Paginated } from "@/types/rbac";
import type { GalleryImage } from "@/types/gallery";

export interface GalleryListParams {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isPublished?: boolean;
    sortBy?: "sortOrder" | "createdAt";
    sortOrder?: "asc" | "desc";
}

export interface GalleryCreatePayload {
    title: string;
    category: string;
    sortOrder?: number;
    isPublished?: boolean;
    file: File;
}

export interface GalleryUpdatePayload {
    title?: string;
    category?: string;
    sortOrder?: number;
    isPublished?: boolean;
}

export const GalleryService = {
    list: async (params: GalleryListParams): Promise<Paginated<GalleryImage>> => {
        const res = await api.get("/api/gallery/admin", { params });
        return res.data;
    },

    create: async (payload: GalleryCreatePayload): Promise<GalleryImage> => {
        const form = new FormData();
        form.append("title", payload.title);
        form.append("category", payload.category);
        if (payload.sortOrder != null) form.append("sortOrder", String(payload.sortOrder));
        form.append("isPublished", String(payload.isPublished ?? true));
        // Append the file LAST so the text fields are parsed before it server-side
        // (the backend reads multipart fields off the file part).
        form.append("file", payload.file);
        const res = await api.post("/api/gallery", form);
        return res.data.data;
    },

    update: async (id: string, payload: GalleryUpdatePayload): Promise<GalleryImage> => {
        const res = await api.put(`/api/gallery/${id}`, payload);
        return res.data.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/api/gallery/${id}`);
    },
};
