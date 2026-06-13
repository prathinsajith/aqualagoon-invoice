import type { PassDurationType, PassEntryType, PassKind, UserPassStatus } from "@/types/pass";

export const PASS_KIND_LABELS: Record<PassKind, string> = {
    GUEST: "Guest",
    STUDENT: "Student",
    VIP: "VIP",
    FAMILY: "Family",
    CORPORATE: "Corporate",
};

const DURATION_UNIT: Record<PassDurationType, string> = {
    HOUR: "hour",
    DAY: "day",
    MONTH: "month",
    YEAR: "year",
};

/** "2 hours", "1 month", "30 days" — pluralised. */
export function formatDuration(type: PassDurationType, value: number): string {
    const unit = DURATION_UNIT[type];
    return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

/** Human description of how many entries a pass allows. */
export function formatEntries(entryType: PassEntryType, allowedEntries: number | null): string {
    if (entryType === "UNLIMITED") return "Unlimited entries";
    return allowedEntries != null ? `${allowedEntries} entries` : "Limited entries";
}

export const PASS_STATUS_LABELS: Record<UserPassStatus, string> = {
    PENDING: "Pending",
    ACTIVE: "Active",
    EXPIRED: "Expired",
    CANCELLED: "Cancelled",
    SUSPENDED: "Suspended",
};
