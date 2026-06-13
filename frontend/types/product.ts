export type ProductStatus = "ACTIVE" | "INACTIVE";

/** A product category as returned by the `/product-categories` endpoints. */
export interface ProductCategory {
    id: string;
    code: string;
    name: string;
    description: string | null;
    status: ProductStatus;
    /** Count of non-deleted products in this category. */
    productsCount: number;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface ProductCategoryRef {
    id: string;
    name: string;
}

/** An inventory product as returned by the `/products` endpoints. */
export interface Product {
    id: string;
    sku: string;
    barcode: string | null;
    categoryId: string;
    category: ProductCategoryRef;
    name: string;
    description: string | null;
    purchasePrice: number;
    sellingPrice: number;
    taxPercentage: number;
    imageUrl: string | null;
    stockQuantity: number;
    minimumStock: number;
    status: ProductStatus;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}
