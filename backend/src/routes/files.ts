import type { FastifyInstance } from "fastify";

/** Object keys this proxy is allowed to presign (defense against reading other keys). */
const ALLOWED_PREFIXES = ["avatars/"];

/**
 * Public proxy for private-bucket objects: resolves a stable `/api/files/<key>`
 * URL into a short-lived presigned GET and 302-redirects to it. Public (no auth)
 * so it works directly in `<img>` tags; scoped to known key prefixes.
 */
export async function filesRoutes(app: FastifyInstance): Promise<void> {
  app.get("/files/*", async (request, reply) => {
    const key = (request.params as Record<string, string>)["*"] ?? "";

    const allowed =
      !key.includes("..") && ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix));
    if (!allowed || !app.storage.presignGet) {
      return reply.status(404).send({ message: "Not found", code: "NOT_FOUND" });
    }

    const url = await app.storage.presignGet(key);
    return reply.redirect(url, 302);
  });
}
