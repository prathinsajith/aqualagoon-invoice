import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import { verifyAccessToken } from "../lib/tokens.js";
import { Forbidden, Unauthorized } from "../lib/errors.js";

/** The authenticated principal attached to each request after `authenticate`. */
export interface CurrentUser {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  roles: string[];
  /** Flattened set of permission names granted via the user's roles. */
  permissions: Set<string>;
}

declare module "fastify" {
  interface FastifyRequest {
    currentUser?: CurrentUser;
  }
  interface FastifyInstance {
    /** preHandler: verifies the bearer token and loads `request.currentUser`. */
    authenticate: preHandlerHookHandler;
    /** Builds a preHandler that requires the given permission name. */
    requirePermission: (permission: string) => preHandlerHookHandler;
  }
}

/**
 * Loads the user behind a verified access token along with the flattened set of
 * permission names granted through their roles. Returns null when the user is
 * missing, archived, inactive, or the token has been invalidated.
 */
async function loadCurrentUser(
  request: FastifyRequest,
  userId: string,
  tokenVersion: number,
): Promise<CurrentUser | null> {
  const user = await request.server.prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: {
      userRoles: {
        include: {
          // Only the permission name is needed to build the permission Set.
          role: { include: { rolePermissions: { include: { permission: { select: { name: true } } } } } },
        },
      },
    },
  });

  if (!user) return null;
  if (user.status !== "ACTIVE") throw Forbidden("Your account is not active");
  if (user.tokenVersion !== tokenVersion) return null;

  const roles: string[] = [];
  const permissions = new Set<string>();
  for (const ur of user.userRoles) {
    roles.push(ur.role.name);
    for (const rp of ur.role.rolePermissions) permissions.add(rp.permission.name);
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles,
    permissions,
  };
}

export default fp(
  async (app) => {
    app.decorate(
      "authenticate",
      async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
        const header = request.headers.authorization;
        if (!header || !header.startsWith("Bearer ")) {
          throw Unauthorized("Missing or malformed Authorization header");
        }

        const payload = await verifyAccessToken(header.slice(7));
        const current = await loadCurrentUser(request, payload.sub, payload.ver);
        if (!current) throw Unauthorized("Session is no longer valid");

        request.currentUser = current;
      },
    );

    app.decorate("requirePermission", (permission: string): preHandlerHookHandler => {
      return async function requirePermission(request: FastifyRequest) {
        if (!request.currentUser) {
          // `authenticate` must run before this guard in the preHandler chain.
          throw Unauthorized();
        }
        if (!request.currentUser.permissions.has(permission)) {
          throw Forbidden(`Missing required permission: ${permission}`);
        }
      };
    });
  },
  { name: "auth", dependencies: ["prisma"] },
);
