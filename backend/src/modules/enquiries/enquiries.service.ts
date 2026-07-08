import { Prisma } from "../../generated/prisma/client.js";
import type { Enquiry, PrismaClient } from "../../generated/prisma/client.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import { toSkipTake } from "../../lib/pagination.js";
import type { PaginationMeta } from "../../lib/response.js";
import { NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import { env } from "../../config/env.js";
import { notifyNewEnquiry } from "../../lib/notify.js";
import { loadMailBranding } from "../../lib/mail/branding.js";
import type { ActorContext } from "../users/users.service.js";
import type { z } from "zod";
import type { createEnquiryBody, enquirySchema, listEnquiriesQuery } from "./enquiries.schema.js";

type EnquiryDto = z.infer<typeof enquirySchema>;
type CreateEnquiryInput = z.infer<typeof createEnquiryBody>;
type ListEnquiriesQuery = z.infer<typeof listEnquiriesQuery>;

const clean = (v?: string) => {
  const t = v?.trim();
  return t ? t : null;
};

function toDto(e: Enquiry): EnquiryDto {
  return {
    id: e.id,
    name: e.name,
    phone: e.phone,
    email: e.email,
    service: e.service,
    message: e.message,
    eventDate: e.eventDate,
    eventType: e.eventType,
    guests: e.guests,
    source: e.source,
    status: e.status,
    handledBy: e.handledBy,
    handledAt: e.handledAt,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

export class EnquiriesService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Public — capture a lead from the website form. */
  async create(input: CreateEnquiryInput): Promise<EnquiryDto> {
    const row = await this.prisma.enquiry.create({
      data: {
        name: input.name,
        phone: clean(input.phone),
        email: clean(input.email),
        service: clean(input.service),
        message: clean(input.message),
        eventDate: input.eventDate ?? null,
        eventType: clean(input.eventType),
        guests: clean(input.guests),
        source: input.source,
      },
    });
    const dto = toDto(row);

    // Notify the business (email + WhatsApp) — best-effort, never blocks or
    // fails the visitor's submission.
    void this.notify(dto);

    return dto;
  }

  private async notify(dto: EnquiryDto): Promise<void> {
    try {
      const [brand, contact] = await Promise.all([
        loadMailBranding(this.prisma),
        this.contactInfo(),
      ]);
      const adminEmail = env.ENQUIRY_NOTIFY_EMAIL || contact.email || env.EMAIL_FROM;
      await notifyNewEnquiry({
        brand,
        adminEmail,
        contact,
        notice: {
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          service: dto.service,
          message: dto.message,
          // Booking-only fields (event date shown as YYYY-MM-DD).
          eventDate: dto.eventDate ? dto.eventDate.toISOString().slice(0, 10) : null,
          eventType: dto.eventType,
          guests: dto.guests,
          source: dto.source,
        },
      });
    } catch (error) {
      console.error("[enquiry] notification failed:", error);
    }
  }

  /** The site's configured contact details (from CMS) — notify recipient + visitor-facing contact. */
  private async contactInfo(): Promise<{ email: string | null; phone: string | null }> {
    const row = await this.prisma.siteContent.findUnique({ where: { key: "contact" } });
    const data = (row?.data ?? null) as { email?: unknown; phone?: unknown } | null;
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    return { email: str(data?.email), phone: str(data?.phone) };
  }

  async list(
    query: ListEnquiriesQuery,
  ): Promise<{ data: EnquiryDto[]; meta: { pagination: PaginationMeta } }> {
    const where: Prisma.EnquiryWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.source) where.source = query.source;
    if (query.search) {
      const contains = { contains: query.search, mode: "insensitive" as const };
      where.OR = [{ name: contains }, { phone: contains }, { email: contains }];
    }

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await Promise.all([
      this.prisma.enquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      this.prisma.enquiry.count({ where }),
    ]);
    return {
      data: rows.map(toDto),
      meta: { pagination: buildPaginationMeta(query.page, query.limit, total) },
    };
  }

  async updateStatus(
    id: string,
    status: EnquiryDto["status"],
    actor: ActorContext,
  ): Promise<EnquiryDto> {
    const existing = await this.prisma.enquiry.findUnique({ where: { id } });
    if (!existing) throw NotFound("Enquiry not found");

    const updated = await this.prisma.enquiry.update({
      where: { id },
      data: {
        status,
        handledBy: actor.userId,
        handledAt: status === "NEW" ? null : new Date(),
      },
    });

    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.ENQUIRY_UPDATE,
      module: "enquiries",
      recordId: id,
      oldData: { status: existing.status },
      newData: { status },
      ipAddress: actor.ip,
    });

    return toDto(updated);
  }
}
