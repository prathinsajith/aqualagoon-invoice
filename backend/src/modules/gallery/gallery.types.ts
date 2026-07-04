import type { z } from "zod";
import type { GalleryImage } from "../../generated/prisma/client.js";
import type {
  createGalleryBody,
  gallerySchema,
  listGalleryQuery,
  updateGalleryBody,
} from "./gallery.schema.js";

export type GalleryDto = z.infer<typeof gallerySchema>;
export type CreateGalleryInput = z.infer<typeof createGalleryBody>;
export type UpdateGalleryInput = z.infer<typeof updateGalleryBody>;
export type ListGalleryQuery = z.infer<typeof listGalleryQuery>;

export function toGalleryDto(g: GalleryImage): GalleryDto {
  return {
    id: g.id,
    title: g.title,
    category: g.category,
    imageUrl: g.imageUrl,
    sortOrder: g.sortOrder,
    isPublished: g.isPublished,
    createdBy: g.createdBy,
    updatedBy: g.updatedBy,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}
