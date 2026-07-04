import { Prisma } from "../../generated/prisma/client.js";
import type { GalleryImage, PrismaClient } from "../../generated/prisma/client.js";
import { toSkipTake } from "../../lib/pagination.js";
import type { ListGalleryQuery } from "./gallery.types.js";

export interface PersistGalleryInput {
  title: string;
  category: string;
  imageUrl: string;
  sortOrder: number;
  isPublished: boolean;
  createdBy: string | null;
}

export interface UpdateGalleryData {
  title?: string;
  category?: string;
  sortOrder?: number;
  isPublished?: boolean;
  imageUrl?: string;
  updatedBy: string | null;
}

export class GalleryRepository {
  constructor(private readonly db: PrismaClient) {}

  /** Published rows for the public site, ordered for display. */
  publicList(category?: string): Promise<GalleryImage[]> {
    return this.db.galleryImage.findMany({
      where: { deletedAt: null, isPublished: true, ...(category ? { category } : {}) },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  /** Distinct categories among published rows (for the public filter bar). */
  async publicCategories(): Promise<string[]> {
    const rows = await this.db.galleryImage.findMany({
      where: { deletedAt: null, isPublished: true },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });
    return rows.map((r) => r.category);
  }

  async list(query: ListGalleryQuery): Promise<{ rows: GalleryImage[]; total: number }> {
    const where: Prisma.GalleryImageWhereInput = { deletedAt: null };
    if (query.category) where.category = query.category;
    if (query.isPublished !== undefined) where.isPublished = query.isPublished;
    if (query.search) where.title = { contains: query.search, mode: "insensitive" };

    const orderBy: Prisma.GalleryImageOrderByWithRelationInput =
      query.sortBy === "createdAt"
        ? { createdAt: query.sortOrder }
        : { sortOrder: query.sortOrder };

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await Promise.all([
      this.db.galleryImage.findMany({ where, orderBy, skip, take }),
      this.db.galleryImage.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string): Promise<GalleryImage | null> {
    return this.db.galleryImage.findFirst({ where: { id, deletedAt: null } });
  }

  create(input: PersistGalleryInput): Promise<GalleryImage> {
    return this.db.galleryImage.create({
      data: {
        title: input.title,
        category: input.category,
        imageUrl: input.imageUrl,
        sortOrder: input.sortOrder,
        isPublished: input.isPublished,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
      },
    });
  }

  update(id: string, data: UpdateGalleryData): Promise<GalleryImage> {
    return this.db.galleryImage.update({ where: { id }, data });
  }

  async softDelete(id: string, deletedBy: string | null): Promise<void> {
    await this.db.galleryImage.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: deletedBy },
    });
  }
}
