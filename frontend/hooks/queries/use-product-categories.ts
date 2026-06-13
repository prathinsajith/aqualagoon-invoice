"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductCategoryService } from "@/services/product-category-service";
import type { CategoryListParams, CategoryPayload } from "@/services/product-category-service";

export const categoryKeys = {
    all: ["product-categories"] as const,
    list: (params: CategoryListParams) => ["product-categories", "list", params] as const,
    detail: (id: string) => ["product-categories", "detail", id] as const,
};

export function useProductCategories(params: CategoryListParams) {
    return useQuery({
        queryKey: categoryKeys.list(params),
        queryFn: () => ProductCategoryService.list(params),
        placeholderData: keepPreviousData,
    });
}

export function useProductCategory(id: string | null) {
    return useQuery({
        queryKey: categoryKeys.detail(id ?? ""),
        queryFn: () => ProductCategoryService.get(id!),
        enabled: !!id,
    });
}

export function useCategoryMutations() {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: categoryKeys.all });

    const create = useMutation({
        mutationFn: (payload: CategoryPayload) => ProductCategoryService.create(payload),
        onSuccess: invalidate,
    });
    const update = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: CategoryPayload }) =>
            ProductCategoryService.update(id, payload),
        onSuccess: invalidate,
    });
    const remove = useMutation({
        mutationFn: (id: string) => ProductCategoryService.remove(id),
        onSuccess: invalidate,
    });

    return { create, update, remove };
}
