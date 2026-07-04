"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductCategoryService } from "@/services/product-category-service";
import type { CategoryListParams, CategoryPayload } from "@/services/product-category-service";

const categoryKeys = {
    all: ["product-categories"] as const,
    list: (params: CategoryListParams) => ["product-categories", "list", params] as const,
    detail: (id: string) => ["product-categories", "detail", id] as const,
};

export function useProductCategories(
    params: CategoryListParams,
    options?: { enabled?: boolean },
) {
    return useQuery({
        queryKey: categoryKeys.list(params),
        queryFn: () => ProductCategoryService.list(params),
        placeholderData: keepPreviousData,
        enabled: options?.enabled,
    });
}

export function useCategoryMutations() {
    const qc = useQueryClient();

    const create = useMutation({
        mutationFn: (payload: CategoryPayload) => ProductCategoryService.create(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
    });
    const update = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: CategoryPayload }) =>
            ProductCategoryService.update(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
    });
    const remove = useMutation({
        mutationFn: (id: string) => ProductCategoryService.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
    });

    return { create, update, remove };
}
