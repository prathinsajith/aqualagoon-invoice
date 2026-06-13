import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  createUserBody,
  listUsersQuery,
  updateUserBody,
  userSchema,
} from "./users.schema.js";

export type UserDto = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserBody>;
export type UpdateUserInput = z.infer<typeof updateUserBody>;
export type ListUsersQuery = z.infer<typeof listUsersQuery>;

/** Prisma include that pulls the role refs needed to build a {@link UserDto}. */
export const userInclude = {
  userRoles: { include: { role: { select: { id: true, name: true } } } },
} satisfies Prisma.UserInclude;

export type UserWithRoles = Prisma.UserGetPayload<{ include: typeof userInclude }>;

/** Maps a Prisma user (with roles) into the public DTO. */
export function toUserDto(user: UserWithRoles): UserDto {
  return {
    id: user.id,
    userCode: user.userCode,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    photoUrl: user.photoUrl,
    address: user.address,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: user.deletedAt,
    roles: user.userRoles.map((ur) => ur.role),
  };
}
