import type { FastifyRequest } from "fastify";
import { BadRequest } from "../../lib/errors.js";
import type { ActorContext } from "../users/users.service.js";
import type { CompanyService } from "./company.service.js";
import type { UpdateCompanyInput } from "./company.types.js";

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createCompanyController(service: CompanyService) {
  return {
    get: async () => {
      return { data: await service.get() };
    },

    update: async (request: FastifyRequest<{ Body: UpdateCompanyInput }>) => {
      return { data: await service.update(request.body, actorOf(request)) };
    },

    uploadLogo: async (request: FastifyRequest) => {
      const file = await request.file();
      if (!file) throw BadRequest("No image file was provided");
      const logoUrl = await request.server.saveImage(file);
      return { data: await service.updateLogo(logoUrl, actorOf(request)) };
    },
  };
}
