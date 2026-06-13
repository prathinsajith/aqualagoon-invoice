import { api } from "@/lib/axios";
import type { Paginated } from "@/types/rbac";
import type { PassKind, UserPass, UserPassDetail, UserPassStatus } from "@/types/pass";

export interface PassListParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserPassStatus;
    type?: PassKind;
    passTypeId?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    expiryWindow?: "expiring5" | "expired5" | "expired10";
    sortBy?: "createdAt" | "expiryTime";
    sortOrder?: "asc" | "desc";
}

export interface RenewPayload {
    durationValue?: number;
    remarks?: string | null;
}

export const PassService = {
    list: async (params: PassListParams): Promise<Paginated<UserPass>> => {
        const res = await api.get("/api/passes", { params });
        return res.data;
    },

    get: async (id: string): Promise<UserPassDetail> => {
        const res = await api.get(`/api/passes/${id}`);
        return res.data.data;
    },

    activate: async (id: string): Promise<UserPass> => {
        const res = await api.post(`/api/passes/${id}/activate`);
        return res.data.data;
    },

    suspend: async (id: string, reason?: string): Promise<UserPass> => {
        const res = await api.post(`/api/passes/${id}/suspend`, { reason: reason ?? null });
        return res.data.data;
    },

    cancel: async (id: string, reason?: string): Promise<UserPass> => {
        const res = await api.post(`/api/passes/${id}/cancel`, { reason: reason ?? null });
        return res.data.data;
    },

    renew: async (id: string, payload: RenewPayload = {}): Promise<UserPass> => {
        const res = await api.post(`/api/passes/${id}/renew`, payload);
        return res.data.data;
    },

    entry: async (id: string, remarks?: string): Promise<UserPassDetail> => {
        const res = await api.post(`/api/passes/${id}/entry`, { remarks: remarks ?? null });
        return res.data.data;
    },

    exit: async (id: string, remarks?: string): Promise<UserPassDetail> => {
        const res = await api.post(`/api/passes/${id}/exit`, { remarks: remarks ?? null });
        return res.data.data;
    },
};
