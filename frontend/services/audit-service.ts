import { api } from "@/lib/axios";
import type { AuditLog, Paginated } from "@/types/rbac";

export interface AuditListParams {
    page?: number;
    limit?: number;
    search?: string;
    userId?: string;
    module?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
    sortOrder?: "asc" | "desc";
}

export const AuditService = {
    list: async (params: AuditListParams): Promise<Paginated<AuditLog>> => {
        const res = await api.get("/api/audit-logs", { params });
        return res.data;
    },
};
