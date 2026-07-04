import type { z } from "zod";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { ActorContext } from "../users/users.service.js";
import {
  SECTION_SCHEMAS,
  aboutSchema,
  brandingSchema,
  contactSchema,
  homepageSchema,
  servicesSchema,
  pricingSchema,
  timetableSchema,
  siteContentSchema,
  type SectionKey,
} from "./site-content.schema.js";

export type SiteContentDocument = z.infer<typeof siteContentSchema>;

/** Parse stored JSON against a section schema, falling back to defaults. */
function parseOrDefault<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data ?? {});
  return (result.success ? result.data : schema.parse({})) as z.infer<T>;
}

export class SiteContentService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Full content document — stored values merged over per-section defaults. */
  async getAll(): Promise<SiteContentDocument> {
    const rows = await this.prisma.siteContent.findMany();
    const byKey = new Map(rows.map((r) => [r.key, r.data]));
    return {
      homepage: parseOrDefault(homepageSchema, byKey.get("homepage")),
      about: parseOrDefault(aboutSchema, byKey.get("about")),
      contact: parseOrDefault(contactSchema, byKey.get("contact")),
      services: parseOrDefault(servicesSchema, byKey.get("services")),
      pricing: parseOrDefault(pricingSchema, byKey.get("pricing")),
      timetable: parseOrDefault(timetableSchema, byKey.get("timetable")),
      branding: parseOrDefault(brandingSchema, byKey.get("branding")),
    };
  }

  /** Validates + upserts one section, returning the parsed (normalized) value. */
  async update(key: SectionKey, data: unknown, actor: ActorContext): Promise<unknown> {
    const value = SECTION_SCHEMAS[key].parse(data);

    await this.prisma.siteContent.upsert({
      where: { key },
      create: { key, data: value as object, updatedBy: actor.userId },
      update: { data: value as object, updatedBy: actor.userId },
    });

    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.SITE_CONTENT_UPDATE,
      module: "site-content",
      recordId: key,
      newData: value as object,
      ipAddress: actor.ip,
    });

    return value;
  }
}
