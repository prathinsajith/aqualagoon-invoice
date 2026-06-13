"use client";

import { useQuery } from "@tanstack/react-query";
import { CompanyService } from "@/services/company-service";
import { formatDate, formatDateTime, DEFAULT_DATE_FORMAT } from "@/lib/date";

/** Shared company-profile query (branding + display preferences). */
export function useCompany() {
    return useQuery({
        queryKey: ["company"],
        queryFn: CompanyService.get,
        staleTime: 5 * 60 * 1000,
    });
}

/** Date formatters bound to the company's configured date format. */
export function useDateFormat() {
    const { data } = useCompany();
    const fmt = data?.dateFormat ?? DEFAULT_DATE_FORMAT;
    return {
        fmt,
        formatDate: (value: string | Date | null | undefined) => formatDate(value, fmt),
        formatDateTime: (value: string | Date | null | undefined) => formatDateTime(value, fmt),
    };
}
