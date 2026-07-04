"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EnquiryService } from "@/services/enquiry-service";
import type { EnquiryListParams } from "@/services/enquiry-service";
import type { EnquiryStatus } from "@/types/enquiry";

export const enquiryKeys = {
    all: ["enquiries"] as const,
    list: (params: EnquiryListParams) => ["enquiries", "list", params] as const,
};

export function useEnquiries(params: EnquiryListParams) {
    return useQuery({
        queryKey: enquiryKeys.list(params),
        queryFn: () => EnquiryService.list(params),
        placeholderData: keepPreviousData,
    });
}

export function useEnquiryMutations() {
    const qc = useQueryClient();
    const updateStatus = useMutation({
        mutationFn: ({ id, status }: { id: string; status: EnquiryStatus }) =>
            EnquiryService.updateStatus(id, status),
        onSuccess: () => qc.invalidateQueries({ queryKey: enquiryKeys.all }),
    });
    return { updateStatus };
}
