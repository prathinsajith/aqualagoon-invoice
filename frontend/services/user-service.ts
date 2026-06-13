import { api } from "@/lib/axios";
import type { ManagedUser, Paginated, Role } from "@/types/rbac";

export interface UserListParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    roleId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    includeDeleted?: boolean;
    onlyDeleted?: boolean;
    createdFrom?: string;
    createdTo?: string;
}

export interface UserPayload {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string;
    password?: string;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
    status?: string;
    roleIds?: string[];
}

export const UserService = {
    list: async (params: UserListParams): Promise<Paginated<ManagedUser>> => {
        const res = await api.get("/api/users", { params });
        return res.data;
    },

    /** Roles the current user is allowed to assign when creating/editing users. */
    assignableRoles: async (): Promise<Role[]> => {
        const res = await api.get("/api/users/assignable-roles");
        return res.data.data;
    },

    get: async (id: string): Promise<ManagedUser> => {
        const res = await api.get(`/api/users/${id}`);
        return res.data.data;
    },

    create: async (payload: UserPayload): Promise<ManagedUser> => {
        const res = await api.post("/api/users", payload);
        return res.data.data;
    },

    update: async (id: string, payload: UserPayload): Promise<ManagedUser> => {
        const res = await api.put(`/api/users/${id}`, payload);
        return res.data.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/api/users/${id}`);
    },

    restore: async (id: string): Promise<ManagedUser> => {
        const res = await api.post(`/api/users/${id}/restore`);
        return res.data.data;
    },

    uploadPhoto: async (id: string, file: File): Promise<ManagedUser> => {
        const form = new FormData();
        form.append("file", file);
        const res = await api.post(`/api/users/${id}/photo`, form);
        return res.data.data;
    },
};
