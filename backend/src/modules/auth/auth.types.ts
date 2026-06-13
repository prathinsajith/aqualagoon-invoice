import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  authUserSchema,
  changePasswordBody,
  loginBody,
  refreshBody,
  resetPasswordBody,
} from "./auth.schema.js";

export type AuthUserDto = z.infer<typeof authUserSchema>;
export type LoginInput = z.infer<typeof loginBody>;
export type RefreshInput = z.infer<typeof refreshBody>;
export type ResetPasswordInput = z.infer<typeof resetPasswordBody>;
export type ChangePasswordInput = z.infer<typeof changePasswordBody>;

/** Include that resolves a user's roles and their flattened permission names. */
export const authUserInclude = {
  userRoles: {
    include: {
      role: {
        include: { rolePermissions: { include: { permission: { select: { name: true } } } } },
      },
    },
  },
} satisfies Prisma.UserInclude;

export type AuthUser = Prisma.UserGetPayload<{ include: typeof authUserInclude }>;

export function toAuthUserDto(user: AuthUser): AuthUserDto {
  const roles: string[] = [];
  const permissions = new Set<string>();
  for (const ur of user.userRoles) {
    roles.push(ur.role.name);
    for (const rp of ur.role.rolePermissions) permissions.add(rp.permission.name);
  }
  return {
    id: user.id,
    userCode: user.userCode,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    photoUrl: user.photoUrl,
    status: user.status,
    twoFactorEnabled: user.totpEnabled,
    roles,
    permissions: [...permissions],
  };
}
