import type { PrismaClient } from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";

/** Resolved company branding used to render outgoing emails. */
export interface MailBranding {
  name: string;
  tagline: string | null;
  /** Absolute, publicly reachable logo URL (emails can't load relative paths). */
  logoUrl: string;
}

const FALLBACK_NAME = "Aqua Lagoon";
const FALLBACK_TAGLINE = "Swimming Pool";
const FALLBACK_LOGO = `${env.FRONTEND_URL}/aqua-lagoon-logo.jpg`;

/**
 * Single source of truth for email branding. Reads the company profile and
 * resolves an absolute logo URL:
 *  - an http(s) logo (e.g. S3) is used as-is;
 *  - an uploaded logo (relative path) is made absolute via PUBLIC_URL;
 *  - otherwise we fall back to the bundled frontend logo.
 */
export async function loadMailBranding(
  prisma: Pick<PrismaClient, "companySetting">,
): Promise<MailBranding> {
  const company = await prisma.companySetting.findFirst().catch(() => null);

  let logoUrl = FALLBACK_LOGO;
  if (company?.logoUrl) {
    if (company.logoUrl.startsWith("http")) {
      logoUrl = company.logoUrl;
    } else if (env.PUBLIC_URL) {
      logoUrl = `${env.PUBLIC_URL.replace(/\/$/, "")}${company.logoUrl}`;
    }
  }

  return {
    name: company?.name || FALLBACK_NAME,
    tagline: company?.tagline ?? FALLBACK_TAGLINE,
    logoUrl,
  };
}
