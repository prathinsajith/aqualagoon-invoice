import type { PrismaClient } from "../../generated/prisma/client.js";
import { userInclude } from "../users/users.types.js";
import type { UserWithRoles } from "../users/users.types.js";
import type { UpdateProfileInput } from "./profile.types.js";

export class ProfileRepository {
  constructor(private readonly db: PrismaClient) {}

  findById(id: string): Promise<UserWithRoles | null> {
    return this.db.user.findFirst({ where: { id, deletedAt: null }, include: userInclude });
  }

  updatePersonal(id: string, data: UpdateProfileInput): Promise<UserWithRoles> {
    return this.db.user.update({ where: { id }, data, include: userInclude });
  }

  updatePhoto(id: string, photoUrl: string): Promise<UserWithRoles> {
    return this.db.user.update({ where: { id }, data: { photoUrl }, include: userInclude });
  }
}
