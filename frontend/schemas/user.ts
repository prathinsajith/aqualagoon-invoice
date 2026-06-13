import { z } from "zod";

export const USER_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;
export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;

const baseUserFields = {
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    // Optional here; the form requires it only for login roles (Admin/Staff/Coach).
    email: z.email("Enter a valid email").optional().or(z.literal("")),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    gender: z.enum(GENDERS).optional().or(z.literal("")),
    dateOfBirth: z.string().optional().or(z.literal("")),
    address: z.string().trim().max(500).optional().or(z.literal("")),
    status: z.enum(USER_STATUSES),
    roleIds: z.array(z.string()),
};

export const createUserSchema = z.object({
    ...baseUserFields,
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
});
export type CreateUserSchema = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
    ...baseUserFields,
    // Optional on edit — leave blank to keep the current password.
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128)
        .optional()
        .or(z.literal("")),
});
export type EditUserSchema = z.infer<typeof editUserSchema>;
