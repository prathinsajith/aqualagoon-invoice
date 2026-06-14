import { api } from "@/lib/axios";
import type {
    InvoiceSummary,
    LowStockProduct,
    PassTypeTotal,
    PaymentMethodTotal,
    RecentEnrollment,
    RevenueBreakdown,
    SalesSummary,
    TopPassBuyer,
    TopProduct,
} from "@/types/billing";
import { toRangeParams, type DateRange } from "@/lib/date-range";

/** Optional date window passed to the analytical dashboard endpoints. */
const rangeParams = (range?: DateRange) => (range ? toRangeParams(range) : {});

export const DashboardService = {
    salesSummary: async (range?: DateRange): Promise<SalesSummary> => {
        const res = await api.get("/api/dashboard/sales-summary", { params: rangeParams(range) });
        return res.data.data;
    },

    revenueBreakdown: async (range?: DateRange): Promise<RevenueBreakdown> => {
        const res = await api.get("/api/dashboard/revenue-breakdown", { params: rangeParams(range) });
        return res.data.data;
    },

    recentEnrollments: async (limit = 5, range?: DateRange): Promise<RecentEnrollment[]> => {
        const res = await api.get("/api/dashboard/recent-enrollments", {
            params: { limit, ...rangeParams(range) },
        });
        return res.data.data;
    },

    paymentsByMethod: async (range?: DateRange): Promise<PaymentMethodTotal[]> => {
        const res = await api.get("/api/dashboard/payments-by-method", { params: rangeParams(range) });
        return res.data.data;
    },

    passesByType: async (range?: DateRange): Promise<PassTypeTotal[]> => {
        const res = await api.get("/api/dashboard/passes-by-type", { params: rangeParams(range) });
        return res.data.data;
    },

    topPassBuyers: async (limit = 5, range?: DateRange): Promise<TopPassBuyer[]> => {
        const res = await api.get("/api/dashboard/top-pass-buyers", {
            params: { limit, ...rangeParams(range) },
        });
        return res.data.data;
    },

    topProducts: async (limit = 5, range?: DateRange): Promise<TopProduct[]> => {
        const res = await api.get("/api/dashboard/top-products", {
            params: { limit, ...rangeParams(range) },
        });
        return res.data.data;
    },

    recentInvoices: async (limit = 5, range?: DateRange): Promise<InvoiceSummary[]> => {
        const res = await api.get("/api/dashboard/recent-invoices", {
            params: { limit, ...rangeParams(range) },
        });
        return res.data.data;
    },

    lowStock: async (limit = 20): Promise<LowStockProduct[]> => {
        const res = await api.get("/api/dashboard/low-stock", { params: { limit } });
        return res.data.data;
    },
};
