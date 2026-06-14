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

/** A sellable line: a PRODUCT, a PASS, or a TRAINING fee, referenced by its id. */
export interface CheckoutLine {
    itemType: "PRODUCT" | "PASS" | "TRAINING";
    id: string;
    quantity: number;
    /** Per-line discount (products only; ignored for passes & fees). */
    discountAmount?: number;
}

export interface CheckoutPayload {
    customerId?: string | null;
    notes?: string | null;
    /** Name of the pass holder (used when selling a pass to a walk-in). */
    holderName?: string | null;
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
    /**
     * Unified POS catalog — sellable products + active passes, plus the selected
     * customer's outstanding training fees when `customerId` is provided.
     */
    catalog: async (search?: string, limit = 24, customerId?: string | null): Promise<CatalogItem[]> => {
        const res = await api.get("/api/billing/items", {
            params: { search: search || undefined, limit, customerId: customerId || undefined },
        });
        return res.data.data;
    },

    checkout: async (payload: CheckoutPayload): Promise<CheckoutResult> => {
        const res = await api.post("/api/billing/checkout", payload);
        return res.data.data;
    },

    /** Collect a payment against a training fee (supports partial / balance). */
    payFee: async (feeId: string, payload: { amount: number; paymentMethodId: string }): Promise<Invoice> => {
        const res = await api.post(`/api/billing/fees/${feeId}/pay`, payload);
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
