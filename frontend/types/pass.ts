import type { ProductStatus } from "@/types/product";

export type PassKind = "GUEST" | "STUDENT" | "VIP" | "FAMILY" | "CORPORATE";
export type PassDurationType = "HOUR" | "DAY" | "MONTH" | "YEAR";
export type PassEntryType = "LIMITED" | "UNLIMITED";
export type PassDiscountType = "NONE" | "FIXED" | "PERCENTAGE";
export type UserPassStatus =
    | "PENDING"
    | "ACTIVE"
    | "EXPIRED"
    | "CANCELLED"
    | "SUSPENDED";

/** A pass type (the sellable template) as returned by `/pass-types`. */
export interface PassType {
    id: string;
    type: PassKind;
    name: string;
    description: string | null;
    durationType: PassDurationType;
    durationValue: number;
    entryType: PassEntryType;
    allowedEntries: number | null;
    maxEntriesPerDay: number | null;
    price: number;
    discountType: PassDiscountType;
    discountValue: number;
    status: ProductStatus;
    /** Count of passes ever issued from this type (blocks deletion when > 0). */
    passesCount: number;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface PassTypeRef {
    id: string;
    name: string;
    type: PassKind;
    durationType: PassDurationType;
    durationValue: number;
    entryType: PassEntryType;
}

export interface PassUsageLog {
    id: string;
    entryTime: string;
    exitTime: string | null;
    remarks: string | null;
    createdAt: string;
}

/** An issued pass (membership instance) as returned by `/passes`. */
export interface UserPass {
    id: string;
    userId: string | null;
    holderName: string | null;
    holderPhotoUrl: string | null;
    passTypeId: string;
    passType: PassTypeRef;
    invoiceId: string | null;
    passNumber: string;
    startTime: string;
    expiryTime: string;
    originalPrice: number;
    discountAmount: number;
    finalAmount: number;
    remainingEntries: number | null;
    status: UserPassStatus;
    activatedAt: string | null;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UserPassDetail extends UserPass {
    usageLogs: PassUsageLog[];
}
