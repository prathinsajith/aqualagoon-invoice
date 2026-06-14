"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaymentMethodService } from "@/services/payment-method-service";
import type {
    PaymentMethodListParams,
    PaymentMethodPayload,
} from "@/services/payment-method-service";

const paymentMethodKeys = {
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

    const create = useMutation({
        mutationFn: (payload: PaymentMethodPayload) => PaymentMethodService.create(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: paymentMethodKeys.all }),
    });
    const update = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<PaymentMethodPayload> }) =>
            PaymentMethodService.update(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: paymentMethodKeys.all }),
    });
    const remove = useMutation({
        mutationFn: (id: string) => PaymentMethodService.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: paymentMethodKeys.all }),
    });
    const reorder = useMutation({
        mutationFn: (orderedIds: string[]) => PaymentMethodService.reorder(orderedIds),
        onSuccess: () => qc.invalidateQueries({ queryKey: paymentMethodKeys.all }),
    });

    return { create, update, remove, reorder };
}
