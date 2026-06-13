import { api } from "@/lib/axios";
import type { Paginated, Role } from "@/types/rbac";

export interface RoleListParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface RolePayload {
    name: string;
    description?: string;
    permissionIds?: string[];
}

export const RoleService = {
    list: async (params: RoleListParams): Promise<Paginated<Role>> => {
        const res = await api.get("/api/roles", { params });
        return res.data;
    },

    get: async (id: string): Promise<Role> => {
        const res = await api.get(`/api/roles/${id}`);
        return res.data.data;
    },

    create: async (payload: RolePayload): Promise<Role> => {
        const res = await api.post("/api/roles", payload);
        return res.data.data;
    },

    update: async (id: string, payload: RolePayload): Promise<Role> => {
        const res = await api.put(`/api/roles/${id}`, payload);
        return res.data.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/api/roles/${id}`);
    },

    /** Persist a new drag order (top-to-bottom). */
    reorder: async (orderedIds: string[]): Promise<Role[]> => {
        const res = await api.put("/api/roles/reorder", { orderedIds });
        return res.data.data;
    },

    /** Set which roles a member of this role may assign/view (admin only). */
    setAssignableRoles: async (id: string, assignableRoleIds: string[]): Promise<Role> => {
        const res = await api.put(`/api/roles/${id}/assignable-roles`, { assignableRoleIds });
        return res.data.data;
    },
};
