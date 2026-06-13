import { api } from "@/lib/axios";
import type { Paginated } from "@/types/rbac";
import type { Product, ProductStatus } from "@/types/product";

export interface ProductListParams {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: ProductStatus;
    onlyDeleted?: boolean;
    sortBy?: "createdAt" | "name";
    sortOrder?: "asc" | "desc";
}

export interface ProductPayload {
    name: string;
    categoryId: string;
    barcode?: string | null;
    description?: string | null;
    purchasePrice?: number;
    sellingPrice: number;
    taxPercentage?: number;
    stockQuantity?: number;
    minimumStock?: number;
    status?: ProductStatus;
}

export const ProductService = {
    list: async (params: ProductListParams): Promise<Paginated<Product>> => {
        const res = await api.get("/api/products", { params });
        return res.data;
    },

    get: async (id: string): Promise<Product> => {
        const res = await api.get(`/api/products/${id}`);
        return res.data.data;
    },

    create: async (payload: ProductPayload): Promise<Product> => {
        const res = await api.post("/api/products", payload);
        return res.data.data;
    },

    update: async (id: string, payload: ProductPayload): Promise<Product> => {
        const res = await api.put(`/api/products/${id}`, payload);
        return res.data.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/api/products/${id}`);
    },

    restore: async (id: string): Promise<Product> => {
        const res = await api.post(`/api/products/${id}/restore`);
        return res.data.data;
    },

    uploadImage: async (id: string, file: File): Promise<Product> => {
        const form = new FormData();
        form.append("file", file);
        // Let axios set the multipart Content-Type (with boundary) itself.
        const res = await api.post(`/api/products/${id}/image`, form);
        return res.data.data;
    },

    deleteImage: async (id: string): Promise<Product> => {
        const res = await api.delete(`/api/products/${id}/image`);
        return res.data.data;
    },
};
