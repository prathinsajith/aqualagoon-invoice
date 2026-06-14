import type { User, UserStatus } from "@/stores/auth-store";

/** Standard paginated envelope returned by list endpoints. */
export interface Paginated<T> {
    data: T[];
    meta: {
        pagination: {
            page: number;
            limit: number;
            totalItems: number;
            totalPages: number;
        };
    };
}

export interface RoleRef {
    id: string;
    name: string;
}

/** A user as returned by the `/users` management endpoints. */
export interface ManagedUser {
    id: string;
    userCode: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    photoUrl: string | null;
    address: string | null;
    status: UserStatus;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    roles: RoleRef[];
}

export interface Permission {
    id: string;
    module: string;
    action: string;
    name: string;
}

export interface Role {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    displayOrder: number;
    usersCount: number;
    permissions: Permission[];
    /** Role ids a member of this role may assign/view when managing users. */
    assignableRoleIds: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Company {
    id: string;
    name: string;
    tagline: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    logoUrl: string | null;
    userCodePrefix: string;
    invoicePrefix: string;
    passPrefix: string;
    currency: string;
    dateFormat: string;
    weeklyOffDays: number[];
    createdAt: string;
    updatedAt: string;
}

export interface AuditLog {
    id: string;
    userId: string | null;
    action: string;
    module: string;
    recordId: string | null;
    oldData: unknown;
    newData: unknown;
    ipAddress: string | null;
    createdAt: string;
    user: { id: string; firstName: string; lastName: string; email: string | null } | null;
}

/** The authenticated principal (login + `/auth/me`). */
export interface AuthResult {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

/** Returned by login when the account has 2FA enabled. */
export interface TwoFactorChallenge {
    twoFactorRequired: true;
    mfaToken: string;
}

export type LoginResult = AuthResult | TwoFactorChallenge;

export interface TwoFactorSetup {
    otpauthUrl: string;
    qrCode: string;
    secret: string;
}

/** Returned when 2FA is enabled or recovery codes are regenerated. */
export interface RecoveryCodesResult {
    message: string;
    recoveryCodes: string[];
}

export interface RecoveryCodesStatus {
    total: number;
    remaining: number;
}
