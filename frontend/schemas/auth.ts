import { z } from "zod";

export const loginSchema = z.object({
    // Email or phone number.
    identifier: z.string().min(3, "Enter your email or phone number"),
    password: z.string().min(1, "Password is required"),
});
export type LoginSchema = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
    identifier: z.string().min(3, "Enter your email or phone number"),
});
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
    .object({
        token: z.string().min(1, "Reset token is required"),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
