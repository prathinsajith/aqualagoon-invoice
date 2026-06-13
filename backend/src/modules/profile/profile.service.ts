import type { PrismaClient } from "../../generated/prisma/client.js";
import { NotFound } from "../../lib/errors.js";
import { AuditAction, writeAudit } from "../../lib/audit.js";
import type { StorageDriver } from "../../lib/storage/index.js";
import type { ActorContext } from "../users/users.service.js";
import { toUserDto } from "../users/users.types.js";
import type { UserDto } from "../users/users.types.js";
import { ProfileRepository } from "./profile.repository.js";
import type { UpdateProfileInput } from "./profile.types.js";

const MODULE = "profile";

export class ProfileService {
  private readonly repo: ProfileRepository;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: StorageDriver,
  ) {
    this.repo = new ProfileRepository(prisma);
  }

  async get(userId: string): Promise<UserDto> {
    const user = await this.repo.findById(userId);
    if (!user) throw NotFound("Profile not found");
    return toUserDto(user);
  }

  async update(userId: string, input: UpdateProfileInput, actor: ActorContext): Promise<UserDto> {
    const existing = await this.repo.findById(userId);
    if (!existing) throw NotFound("Profile not found");

    const updated = await this.repo.updatePersonal(userId, input);
    const after = toUserDto(updated);
    await writeAudit(this.prisma, {
      userId,
      action: AuditAction.PROFILE_UPDATE,
      module: MODULE,
      recordId: userId,
      oldData: toUserDto(existing),
      newData: after,
      ipAddress: actor.ip,
    });
    return after;
  }

  async updatePhoto(userId: string, photoUrl: string, actor: ActorContext): Promise<UserDto> {
    const previous = await this.repo.findById(userId);
    const user = await this.repo.updatePhoto(userId, photoUrl);

    // Best-effort cleanup of the replaced object so storage doesn't accumulate
    // orphans (no-op if the old URL isn't one of ours).
    if (previous?.photoUrl && previous.photoUrl !== photoUrl) {
      await this.storage.deleteByUrl(previous.photoUrl).catch(() => {});
    }

    await writeAudit(this.prisma, {
      userId,
      action: AuditAction.PROFILE_UPDATE,
      module: MODULE,
      recordId: userId,
      newData: { photoUrl },
      ipAddress: actor.ip,
    });
    return toUserDto(user);
  }
}
