/** Pass duration + validation helpers, shared by billing and the passes module. */

export type PassDurationType = "HOUR" | "DAY" | "MONTH" | "YEAR";

/** Adds a validity window to a start time (e.g. 2 HOUR → +2h; 1 MONTH → +1 calendar month). */
export function addDuration(start: Date, type: PassDurationType, value: number): Date {
  const d = new Date(start);
  switch (type) {
    case "HOUR":
      d.setHours(d.getHours() + value);
      break;
    case "DAY":
      d.setDate(d.getDate() + value);
      break;
    case "MONTH":
      d.setMonth(d.getMonth() + value);
      break;
    case "YEAR":
      d.setFullYear(d.getFullYear() + value);
      break;
  }
  return d;
}

/** Minimal pass shape the entry/access checks need. */
export interface ValidatablePass {
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "SUSPENDED";
  expiryTime: Date;
  remainingEntries: number | null;
}

export interface PassValidation {
  ok: boolean;
  reason?: string;
}

/**
 * Reusable pass-validation service. Decides whether a pass may be used right now
 * (entry / QR / access control / attendance all share this rule set).
 */
export function validatePassForEntry(pass: ValidatablePass, now: Date = new Date()): PassValidation {
  if (pass.status === "CANCELLED") return { ok: false, reason: "Pass has been cancelled" };
  if (pass.status === "SUSPENDED") return { ok: false, reason: "Pass is suspended" };
  if (pass.status === "EXPIRED") return { ok: false, reason: "Pass has expired" };
  if (pass.status === "PENDING") return { ok: false, reason: "Pass is not active yet" };
  if (pass.expiryTime.getTime() < now.getTime()) return { ok: false, reason: "Pass has expired" };
  if (pass.remainingEntries !== null && pass.remainingEntries <= 0) {
    return { ok: false, reason: "No remaining entries on this pass" };
  }
  return { ok: true };
}
