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

export function useProduct(id: string | null) {
    return useQuery({
        queryKey: productKeys.detail(id ?? ""),
        queryFn: () => ProductService.get(id!),
        enabled: !!id,
    });
}

export function useProductMutations() {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: productKeys.all });

    const create = useMutation({
        mutationFn: (payload: ProductPayload) => ProductService.create(payload),
        onSuccess: invalidate,
    });
    const update = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: ProductPayload }) =>
            ProductService.update(id, payload),
        onSuccess: invalidate,
    });
    const remove = useMutation({
        mutationFn: (id: string) => ProductService.remove(id),
        onSuccess: invalidate,
    });
    const restore = useMutation({
        mutationFn: (id: string) => ProductService.restore(id),
        onSuccess: invalidate,
    });

    return { create, update, remove, restore };
}
