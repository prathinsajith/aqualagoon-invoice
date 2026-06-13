import { api } from "@/lib/axios";
import type { Paginated } from "@/types/rbac";
import type { PaymentMethod } from "@/types/billing";

export interface PaymentMethodListParams {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: "displayOrder" | "name" | "createdAt";
    sortOrder?: "asc" | "desc";
}

export interface PaymentMethodPayload {
    name: string;
    description?: string | null;
    isActive?: boolean;
    displayOrder?: number;
}

export const PaymentMethodService = {
    list: async (params: PaymentMethodListParams): Promise<Paginated<PaymentMethod>> => {
        const res = await api.get("/api/payment-methods", { params });
        return res.data;
    },

    get: async (id: string): Promise<PaymentMethod> => {
        const res = await api.get(`/api/payment-methods/${id}`);
        return res.data.data;
    },

    create: async (payload: PaymentMethodPayload): Promise<PaymentMethod> => {
        const res = await api.post("/api/payment-methods", payload);
        return res.data.data;
    },

    update: async (
        id: string,
        payload: Partial<PaymentMethodPayload>,
    ): Promise<PaymentMethod> => {
        const res = await api.put(`/api/payment-methods/${id}`, payload);
        return res.data.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/api/payment-methods/${id}`);
    },

    /** Persist a new drag order (top-to-bottom). */
    reorder: async (orderedIds: string[]): Promise<PaymentMethod[]> => {
        const res = await api.put("/api/payment-methods/reorder", { orderedIds });
        return res.data.data;
    },
};
