"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductService } from "@/services/product-service";
import type { ProductListParams, ProductPayload } from "@/services/product-service";

export const productKeys = {
    all: ["products"] as const,
    list: (params: ProductListParams) => ["products", "list", params] as const,
    detail: (id: string) => ["products", "detail", id] as const,
};

export function useProducts(params: ProductListParams) {
    return useQuery({
        queryKey: productKeys.list(params),
        queryFn: () => ProductService.list(params),
        placeholderData: keepPreviousData,
    });
}

export function useProductMutations() {
    const qc = useQueryClient();

    const create = useMutation({
        mutationFn: (payload: ProductPayload) => ProductService.create(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
    });
    const update = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: ProductPayload }) =>
            ProductService.update(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
    });
    const remove = useMutation({
        mutationFn: (id: string) => ProductService.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
    });
    const restore = useMutation({
        mutationFn: (id: string) => ProductService.restore(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
    });

    return { create, update, remove, restore };
}
