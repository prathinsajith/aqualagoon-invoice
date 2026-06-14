import { api } from "@/lib/axios";

export interface Holiday {
    id: string;
    date: string; // YYYY-MM-DD
    name: string | null;
    createdAt: string;
}

export const HolidayService = {
    list: async (): Promise<Holiday[]> => {
        const res = await api.get("/api/holidays");
        return res.data.data;
    },

    create: async (payload: { date: string; name?: string | null }): Promise<Holiday> => {
        const res = await api.post("/api/holidays", payload);
        return res.data.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/api/holidays/${id}`);
    },
};
