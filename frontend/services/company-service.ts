import { api } from "@/lib/axios";
import type { Company } from "@/types/rbac";

export const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD MMM YYYY"] as const;

export interface CompanyPayload {
    name?: string;
    tagline?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    address?: string | null;
    userCodePrefix?: string;
    invoicePrefix?: string;
    passPrefix?: string;
    currency?: string;
    dateFormat?: string;
    weeklyOffDays?: number[];
}

export const CompanyService = {
    get: async (): Promise<Company> => {
        const res = await api.get("/api/company");
        return res.data.data;
    },

    update: async (payload: CompanyPayload): Promise<Company> => {
        const res = await api.put("/api/company", payload);
        return res.data.data;
    },

    uploadLogo: async (file: File): Promise<Company> => {
        const form = new FormData();
        form.append("file", file);
        // Let axios set the multipart boundary automatically.
        const res = await api.post("/api/company/logo", form);
        return res.data.data;
    },
};
