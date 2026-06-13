import { api } from "@/lib/axios";
import type { Permission } from "@/types/rbac";

export const PermissionService = {
    list: async (module?: string): Promise<Permission[]> => {
        const res = await api.get("/api/permissions", { params: module ? { module } : {} });
        return res.data.data;
    },

    listForRole: async (roleId: string): Promise<Permission[]> => {
        const res = await api.get(`/api/roles/${roleId}/permissions`);
        return res.data.data;
    },

    assign: async (roleId: string, permissionIds: string[]): Promise<Permission[]> => {
        const res = await api.post(`/api/roles/${roleId}/permissions`, { permissionIds });
        return res.data.data;
    },

    revoke: async (roleId: string, permissionId: string): Promise<void> => {
        await api.delete(`/api/roles/${roleId}/permissions/${permissionId}`);
    },
};
