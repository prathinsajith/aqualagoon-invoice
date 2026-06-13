import type { PrismaClient } from "../../generated/prisma/client.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { StorageDriver } from "../../lib/storage/index.js";
import type { ActorContext } from "../users/users.service.js";
import { toCompanyDto } from "./company.types.js";
import type { CompanyDto, UpdateCompanyInput } from "./company.types.js";

const MODULE = "company";

/**
 * Company profile is a singleton row. `get` lazily creates it so the app always
 * has a record to read/edit.
 */
export class CompanyService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: StorageDriver,
  ) {}

  private async getOrCreate() {
    const existing = await this.prisma.companySetting.findFirst();
    return existing ?? this.prisma.companySetting.create({ data: {} });
  }

  async get(): Promise<CompanyDto> {
    return toCompanyDto(await this.getOrCreate());
  }

  async update(input: UpdateCompanyInput, actor: ActorContext): Promise<CompanyDto> {
    const existing = await this.getOrCreate();
    const updated = await this.prisma.companySetting.update({
      where: { id: existing.id },
      data: input,
    });
    const after = toCompanyDto(updated);
    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.COMPANY_UPDATE,
      module: MODULE,
      recordId: existing.id,
      oldData: toCompanyDto(existing),
      newData: after,
      ipAddress: actor.ip,
    });
    return after;
  }

  async updateLogo(logoUrl: string, actor: ActorContext): Promise<CompanyDto> {
    const existing = await this.getOrCreate();
    const updated = await this.prisma.companySetting.update({
      where: { id: existing.id },
      data: { logoUrl },
    });

    // Best-effort cleanup of the replaced logo (no-op if not one of ours).
    if (existing.logoUrl && existing.logoUrl !== logoUrl) {
      await this.storage.deleteByUrl(existing.logoUrl).catch(() => {});
    }

    await writeAudit(this.prisma, {
      userId: actor.userId,
      action: AuditAction.COMPANY_UPDATE,
      module: MODULE,
      recordId: existing.id,
      newData: { logoUrl },
      ipAddress: actor.ip,
    });
    return toCompanyDto(updated);
  }
}
