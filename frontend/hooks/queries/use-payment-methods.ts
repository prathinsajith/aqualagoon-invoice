"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaymentMethodService } from "@/services/payment-method-service";
import type {
    PaymentMethodListParams,
    PaymentMethodPayload,
} from "@/services/payment-method-service";

export const paymentMethodKeys = {
    all: ["payment-methods"] as const,
    list: (params: PaymentMethodListParams) => ["payment-methods", "list", params] as const,
};

export function usePaymentMethods(params: PaymentMethodListParams) {
    return useQuery({
        queryKey: paymentMethodKeys.list(params),
        queryFn: () => PaymentMethodService.list(params),
        placeholderData: keepPreviousData,
    });
}

export function usePaymentMethodMutations() {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: paymentMethodKeys.all });

    const create = useMutation({
        mutationFn: (payload: PaymentMethodPayload) => PaymentMethodService.create(payload),
        onSuccess: invalidate,
    });
    const update = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<PaymentMethodPayload> }) =>
            PaymentMethodService.update(id, payload),
        onSuccess: invalidate,
    });
    const remove = useMutation({
        mutationFn: (id: string) => PaymentMethodService.remove(id),
        onSuccess: invalidate,
    });
    const reorder = useMutation({
        mutationFn: (orderedIds: string[]) => PaymentMethodService.reorder(orderedIds),
        onSuccess: invalidate,
    });

    return { create, update, remove, reorder };
}
