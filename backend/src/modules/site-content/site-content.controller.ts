import type { FastifyReply, FastifyRequest } from "fastify";
import { BadRequest } from "../../lib/errors.js";
import type { ActorContext } from "../users/users.service.js";
import type { SiteContentService } from "./site-content.service.js";
import { SECTION_SCHEMAS, type SectionKey } from "./site-content.schema.js";

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createSiteContentController(service: SiteContentService) {
  return {
    // Public — full content document for the marketing site.
    getAll: async () => {
      return { data: await service.getAll() };
    },

    // Admin — validate `body` against the section's schema, then upsert.
    update: async (request: FastifyRequest<{ Params: { key: SectionKey }; Body: unknown }>) => {
      const { key } = request.params;
      const parsed = SECTION_SCHEMAS[key].safeParse(request.body);
      if (!parsed.success) {
        throw BadRequest(parsed.error.issues[0]?.message ?? "Invalid content");
      }
      return { data: await service.update(key, parsed.data, actorOf(request)) };
    },

    // Admin — upload an image (hero, logo, OG) and return its URL to store.
    uploadImage: async (request: FastifyRequest, reply: FastifyReply) => {
      const file = await request.file();
      if (!file) throw BadRequest("No image file was provided");
      const url = await request.server.saveImage(file, "site");
      return reply.send({ data: { url } });
    },
  };
}
