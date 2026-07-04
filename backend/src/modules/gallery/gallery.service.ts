import type { PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { StorageDriver } from "../../lib/storage/index.js";
import type { ActorContext } from "../users/users.service.js";
import { GalleryRepository } from "./gallery.repository.js";
import { toGalleryDto } from "./gallery.types.js";
import type {
  CreateGalleryInput,
  GalleryDto,
  ListGalleryQuery,
  UpdateGalleryInput,
} from "./gallery.types.js";

const MODULE = "gallery";

export class GalleryService {
  private readonly repo: GalleryRepository;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: StorageDriver,
  ) {
    this.repo = new GalleryRepository(prisma);
  }

  /** Published images for the public marketing site (+ available categories). */
  async publicList(category?: string): Promise<{ data: GalleryDto[]; categories: string[] }> {
    const [rows, categories] = await Promise.all([
      this.repo.publicList(category),
      this.repo.publicCategories(),
    ]);
    return { data: rows.map(toGalleryDto), categories };
  }

  async list(
    query: ListGalleryQuery,
  ): Promise<{ data: GalleryDto[]; meta: { pagination: PaginationMeta } }> {
    const { rows, total } = await this.repo.list(query);
    return {
      data: rows.map(toGalleryDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async getById(id: string): Promise<GalleryDto> {
    const row = await this.repo.findById(id);
    if (!row) throw NotFound("Gallery image not found");
    return toGalleryDto(row);
  }

  /** Creates a gallery image from an already-stored object URL. */
  async create(input: CreateGalleryInput, imageUrl: string, actor: ActorContext): Promise<GalleryDto> {
    const row = await this.repo.create({
      title: input.title,
      category: input.category,
      imageUrl,
      sortOrder: input.sortOrder,
      isPublished: input.isPublished,
      createdBy: actor.userId,
    });
    const dto = toGalleryDto(row);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.GALLERY_CREATE,
      module: MODULE,
      recordId: dto.id,
      newData: dto,
      ipAddress: actor.ip,
    });
    return dto;
  }

  async update(id: string, input: UpdateGalleryInput, actor: ActorContext): Promise<GalleryDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw NotFound("Gallery image not found");

    const updated = await this.repo.update(id, {
      title: input.title,
      category: input.category,
      sortOrder: input.sortOrder,
      isPublished: input.isPublished,
      updatedBy: actor.userId,
    });

    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.GALLERY_UPDATE,
      module: MODULE,
      recordId: id,
      oldData: toGalleryDto(existing),
      newData: toGalleryDto(updated),
      ipAddress: actor.ip,
    });
    return toGalleryDto(updated);
  }

  async remove(id: string, actor: ActorContext): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw NotFound("Gallery image not found");

    await this.repo.softDelete(id, actor.userId);
    // Best-effort cleanup of the stored object (soft-delete keeps the row).
    if (existing.imageUrl) await this.storage.deleteByUrl(existing.imageUrl).catch(() => {});

    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.GALLERY_DELETE,
      module: MODULE,
      recordId: id,
      oldData: toGalleryDto(existing),
      ipAddress: actor.ip,
    });
  }
}
