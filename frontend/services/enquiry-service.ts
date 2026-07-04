import { api } from "@/lib/axios";
import type { Paginated } from "@/types/rbac";
import type { Enquiry, EnquiryStatus } from "@/types/enquiry";

export interface EnquiryListParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: EnquiryStatus;
    source?: "contact" | "booking";
}

export const EnquiryService = {
    list: async (params: EnquiryListParams): Promise<Paginated<Enquiry>> => {
        const res = await api.get("/api/enquiries", { params });
        return res.data;
    },

    updateStatus: async (id: string, status: EnquiryStatus): Promise<Enquiry> => {
        const res = await api.patch(`/api/enquiries/${id}`, { status });
        return res.data.data;
    },
};
