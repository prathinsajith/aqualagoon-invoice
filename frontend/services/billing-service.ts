import { api } from "@/lib/axios";
import type { Paginated } from "@/types/rbac";
import type {
    CatalogItem,
    CheckoutResult,
    Invoice,
    InvoiceStatus,
    InvoiceSummary,
    Receipt,
} from "@/types/billing";

/** A sellable line in a checkout: a PRODUCT or a PASS, referenced by its id. */
export interface CheckoutLine {
    itemType: "PRODUCT" | "PASS";
    id: string;
    quantity: number;
    /** Per-line discount (products only; ignored for passes). */
    discountAmount?: number;
}

export interface CheckoutPayload {
    customerId?: string | null;
    notes?: string | null;
    items: CheckoutLine[];
    payment: {
        paymentMethodId: string;
        paidAmount: number;
        transactionReference?: string | null;
        remarks?: string | null;
    };
}

export interface InvoiceListParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: InvoiceStatus;
    invoiceType?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: "createdAt" | "totalAmount" | "invoiceNo";
    sortOrder?: "asc" | "desc";
}

export const BillingService = {
    /** Unified POS catalog search — returns sellable products AND active passes. */
    catalog: async (search?: string, limit = 24): Promise<CatalogItem[]> => {
        const res = await api.get("/api/billing/items", { params: { search: search || undefined, limit } });
        return res.data.data;
    },

    checkout: async (payload: CheckoutPayload): Promise<CheckoutResult> => {
        const res = await api.post("/api/billing/checkout", payload);
        return res.data.data;
    },

    listInvoices: async (params: InvoiceListParams): Promise<Paginated<InvoiceSummary>> => {
        const res = await api.get("/api/invoices", { params });
        return res.data;
    },

    getInvoice: async (id: string): Promise<Invoice> => {
        const res = await api.get(`/api/invoices/${id}`);
        return res.data.data;
    },

    cancelInvoice: async (id: string, reason?: string): Promise<Invoice> => {
        const res = await api.post(`/api/invoices/${id}/cancel`, { reason: reason ?? null });
        return res.data.data;
    },

    receipt: async (id: string): Promise<Receipt> => {
        const res = await api.get(`/api/invoices/${id}/receipt`);
        return res.data.data;
    },
};
