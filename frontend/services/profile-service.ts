import { api } from "@/lib/axios";
import type { ManagedUser } from "@/types/rbac";

export interface ProfilePayload {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    address?: string | null;
}

export const ProfileService = {
    get: async (): Promise<ManagedUser> => {
        const res = await api.get("/api/profile");
        return res.data.data;
    },

    update: async (payload: ProfilePayload): Promise<ManagedUser> => {
        const res = await api.put("/api/profile", payload);
        return res.data.data;
    },

    uploadPhoto: async (file: File): Promise<ManagedUser> => {
        const form = new FormData();
        form.append("file", file);
        // Let axios set Content-Type to multipart/form-data WITH the boundary.
        // Hardcoding the header drops the boundary and the server can't parse it.
        const res = await api.post("/api/profile/photo", form);
        return res.data.data;
    },
};
