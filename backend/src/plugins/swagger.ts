import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

/**
 * Generates an OpenAPI document from the Zod route schemas and serves an
 * interactive explorer at `/docs`. `jsonSchemaTransform` converts the Zod
 * schemas attached to each route into JSON Schema for the spec.
 */
export default fp(
  async (app) => {
    await app.register(swagger, {
      openapi: {
        info: {
          title: "Aqualagoon API",
          description: "Fastify 5 + Prisma 7 backend for the Aqualagoon admin app.",
          version: "0.1.0",
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description: "Access token issued by POST /api/auth/login.",
            },
          },
        },
      },
      transform: jsonSchemaTransform,
    });

    await app.register(swaggerUi, {
      routePrefix: "/docs",
    });
  },
  { name: "swagger" },
);
