import { api } from "@/lib/axios";
import type { Paginated } from "@/types/rbac";
import type { ProductCategory, ProductStatus } from "@/types/product";

export interface CategoryListParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: ProductStatus;
    sortBy?: "createdAt" | "name";
    sortOrder?: "asc" | "desc";
}

export interface CategoryPayload {
    name: string;
    description?: string | null;
    status?: ProductStatus;
}

export const ProductCategoryService = {
    list: async (params: CategoryListParams): Promise<Paginated<ProductCategory>> => {
        const res = await api.get("/api/product-categories", { params });
        return res.data;
    },

    get: async (id: string): Promise<ProductCategory> => {
        const res = await api.get(`/api/product-categories/${id}`);
        return res.data.data;
    },

    create: async (payload: CategoryPayload): Promise<ProductCategory> => {
        const res = await api.post("/api/product-categories", payload);
        return res.data.data;
    },

    update: async (id: string, payload: CategoryPayload): Promise<ProductCategory> => {
        const res = await api.put(`/api/product-categories/${id}`, payload);
        return res.data.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/api/product-categories/${id}`);
    },
};
