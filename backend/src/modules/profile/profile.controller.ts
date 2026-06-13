import type { FastifyRequest } from "fastify";
import { BadRequest } from "../../lib/errors.js";
import type { ActorContext } from "../users/users.service.js";
import type { ProfileService } from "./profile.service.js";
import type { UpdateProfileInput } from "./profile.types.js";

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createProfileController(service: ProfileService) {
  return {
    get: async (request: FastifyRequest) => {
      return { data: await service.get(request.currentUser!.id) };
    },

    update: async (request: FastifyRequest<{ Body: UpdateProfileInput }>) => {
      return { data: await service.update(request.currentUser!.id, request.body, actorOf(request)) };
    },

    uploadPhoto: async (request: FastifyRequest) => {
      const file = await request.file();
      if (!file) throw BadRequest("No image file was provided");
      const photoUrl = await request.server.saveImage(file);
      return { data: await service.updatePhoto(request.currentUser!.id, photoUrl, actorOf(request)) };
    },
  };
}
