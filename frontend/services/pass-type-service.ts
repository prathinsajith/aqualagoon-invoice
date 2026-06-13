import { api } from "@/lib/axios";
import type { Paginated } from "@/types/rbac";
import type { ProductStatus } from "@/types/product";
import type {
    PassDiscountType,
    PassDurationType,
    PassEntryType,
    PassKind,
    PassType,
} from "@/types/pass";

export interface PassTypeListParams {
    page?: number;
    limit?: number;
    search?: string;
    type?: PassKind;
    status?: ProductStatus;
    sortBy?: "createdAt" | "name" | "price";
    sortOrder?: "asc" | "desc";
}

export interface PassTypePayload {
    type: PassKind;
    name: string;
    description?: string | null;
    durationType: PassDurationType;
    durationValue: number;
    entryType: PassEntryType;
    allowedEntries?: number | null;
    maxEntriesPerDay?: number | null;
    price: number;
    discountType: PassDiscountType;
    discountValue: number;
    status?: ProductStatus;
}

export const PassTypeService = {
    list: async (params: PassTypeListParams): Promise<Paginated<PassType>> => {
        const res = await api.get("/api/pass-types", { params });
        return res.data;
    },

    get: async (id: string): Promise<PassType> => {
        const res = await api.get(`/api/pass-types/${id}`);
        return res.data.data;
    },

    create: async (payload: PassTypePayload): Promise<PassType> => {
        const res = await api.post("/api/pass-types", payload);
        return res.data.data;
    },

    update: async (id: string, payload: Partial<PassTypePayload>): Promise<PassType> => {
        const res = await api.put(`/api/pass-types/${id}`, payload);
        return res.data.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/api/pass-types/${id}`);
    },
};
