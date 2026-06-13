"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BillingService } from "@/services/billing-service";
import type { InvoiceListParams } from "@/services/billing-service";

export const invoiceKeys = {
    all: ["invoices"] as const,
    list: (params: InvoiceListParams) => ["invoices", "list", params] as const,
    detail: (id: string) => ["invoices", "detail", id] as const,
};

export function useInvoices(params: InvoiceListParams) {
    return useQuery({
        queryKey: invoiceKeys.list(params),
        queryFn: () => BillingService.listInvoices(params),
        placeholderData: keepPreviousData,
    });
}

export function useInvoice(id: string | null) {
    return useQuery({
        queryKey: invoiceKeys.detail(id ?? ""),
        queryFn: () => BillingService.getInvoice(id!),
        enabled: !!id,
    });
}

export function useInvoiceMutations() {
    const qc = useQueryClient();
    const cancel = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            BillingService.cancelInvoice(id, reason),
        onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.all }),
    });
    return { cancel };
}
