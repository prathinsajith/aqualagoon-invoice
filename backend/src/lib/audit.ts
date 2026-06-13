import { Prisma } from "../generated/prisma/client.js";
import type { PrismaClient } from "../generated/prisma/client.js";

/** Stable audit action identifiers. */
export const AuditAction = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  LOGOUT_ALL: "LOGOUT_ALL",
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_DELETE: "USER_DELETE",
  USER_RESTORE: "USER_RESTORE",
  ROLE_CREATE: "ROLE_CREATE",
  ROLE_UPDATE: "ROLE_UPDATE",
  ROLE_DELETE: "ROLE_DELETE",
  ROLE_ASSIGNMENT: "ROLE_ASSIGNMENT",
  PERMISSION_ASSIGNMENT: "PERMISSION_ASSIGNMENT",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  PASSWORD_RESET: "PASSWORD_RESET",
  PROFILE_UPDATE: "PROFILE_UPDATE",
  COMPANY_UPDATE: "COMPANY_UPDATE",
  TWO_FACTOR_ENABLED: "TWO_FACTOR_ENABLED",
  TWO_FACTOR_DISABLED: "TWO_FACTOR_DISABLED",
  RECOVERY_CODES_REGENERATED: "RECOVERY_CODES_REGENERATED",
  PRODUCT_CATEGORY_CREATE: "PRODUCT_CATEGORY_CREATE",
  PRODUCT_CATEGORY_UPDATE: "PRODUCT_CATEGORY_UPDATE",
  PRODUCT_CATEGORY_DELETE: "PRODUCT_CATEGORY_DELETE",
  PRODUCT_CREATE: "PRODUCT_CREATE",
  PRODUCT_UPDATE: "PRODUCT_UPDATE",
  PRODUCT_DELETE: "PRODUCT_DELETE",
  PRODUCT_RESTORE: "PRODUCT_RESTORE",
  PAYMENT_METHOD_CREATE: "PAYMENT_METHOD_CREATE",
  PAYMENT_METHOD_UPDATE: "PAYMENT_METHOD_UPDATE",
  PAYMENT_METHOD_ACTIVATE: "PAYMENT_METHOD_ACTIVATE",
  PAYMENT_METHOD_DEACTIVATE: "PAYMENT_METHOD_DEACTIVATE",
  PAYMENT_METHOD_DELETE: "PAYMENT_METHOD_DELETE",
  INVOICE_CREATE: "INVOICE_CREATE",
  INVOICE_CANCEL: "INVOICE_CANCEL",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  PASS_TYPE_CREATE: "PASS_TYPE_CREATE",
  PASS_TYPE_UPDATE: "PASS_TYPE_UPDATE",
  PASS_TYPE_ACTIVATE: "PASS_TYPE_ACTIVATE",
  PASS_TYPE_DEACTIVATE: "PASS_TYPE_DEACTIVATE",
  PASS_TYPE_DELETE: "PASS_TYPE_DELETE",
  PASS_SOLD: "PASS_SOLD",
  PASS_ACTIVATED: "PASS_ACTIVATED",
  PASS_SUSPENDED: "PASS_SUSPENDED",
  PASS_CANCELLED: "PASS_CANCELLED",
  PASS_RENEWED: "PASS_RENEWED",
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

/** Any client capable of writing — the base client or a transaction client. */
export type PrismaClientLike = Pick<PrismaClient, "auditLog">;

export interface AuditEntry {
  /** The user performing the action (null for anonymous, e.g. failed login). */
  userId?: string | null;
  action: AuditActionType;
  module: string;
  recordId?: string | null;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string | null;
}

/** Converts an arbitrary value into a JSON-safe Prisma input (Dates → ISO). */
function toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined || value === null) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Writes an audit-log row. Best-effort: auditing must never fail the user-facing
 * action it records, so write errors are swallowed (and logged to stderr).
 * Pass a transaction client to make the audit part of an atomic operation.
 */
export async function writeAudit(
  db: PrismaClientLike,
  entry: AuditEntry,
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        module: entry.module,
        recordId: entry.recordId ?? null,
        oldData: toJson(entry.oldData),
        newData: toJson(entry.newData),
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write audit log:", error);
  }
}
