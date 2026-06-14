import type { z } from "zod";
import type { CompanySetting } from "../../generated/prisma/client.js";
import type { companySchema, updateCompanyBody } from "./company.schema.js";

export type CompanyDto = z.infer<typeof companySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanyBody>;

export function toCompanyDto(row: CompanySetting): CompanyDto {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    email: row.email,
    phone: row.phone,
    website: row.website,
    address: row.address,
    logoUrl: row.logoUrl,
    userCodePrefix: row.userCodePrefix,
    invoicePrefix: row.invoicePrefix,
    passPrefix: row.passPrefix,
    currency: row.currency,
    dateFormat: row.dateFormat,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
