export interface GalleryImage {
    id: string;
    title: string;
    category: string;
    imageUrl: string;
    sortOrder: number;
    isPublished: boolean;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
}
