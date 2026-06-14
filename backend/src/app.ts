import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import {
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { env } from "./config/env.js";
import { Prisma } from "./generated/prisma/client.js";
import { isAppError } from "./lib/errors.js";
import swaggerPlugin from "./plugins/swagger.js";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import rateLimitPlugin from "./plugins/rate-limit.js";
import uploadsPlugin from "./plugins/uploads.js";
import passExpiryPlugin from "./plugins/pass-expiry.js";
import { healthRoutes } from "./routes/health.js";
import { statusRoutes } from "./routes/status.js";
import { filesRoutes } from "./routes/files.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { rolesRoutes } from "./modules/roles/roles.routes.js";
import { permissionsRoutes } from "./modules/permissions/permissions.routes.js";
import { profileRoutes } from "./modules/profile/profile.routes.js";
import { companyRoutes } from "./modules/company/company.routes.js";
import { holidaysRoutes } from "./modules/holidays/holidays.routes.js";
import { auditLogsRoutes } from "./modules/audit-logs/audit-logs.routes.js";
import { productCategoriesRoutes } from "./modules/product-categories/product-categories.routes.js";
import { productsRoutes } from "./modules/products/products.routes.js";
import { paymentMethodsRoutes } from "./modules/payment-methods/payment-methods.routes.js";
import { billingRoutes } from "./modules/billing/billing.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { passTypesRoutes } from "./modules/pass-types/pass-types.routes.js";
import { passesRoutes } from "./modules/passes/passes.routes.js";
import { trainingTypesRoutes } from "./modules/training-types/training-types.routes.js";
import { trainingProgramsRoutes } from "./modules/training-programs/training-programs.routes.js";
import { feePlansRoutes } from "./modules/fee-plans/fee-plans.routes.js";
import { batchesRoutes } from "./modules/batches/batches.routes.js";
import { enrollmentsRoutes } from "./modules/enrollments/enrollments.routes.js";
import { attendanceRoutes } from "./modules/attendance/attendance.routes.js";
import { studentFeesRoutes } from "./modules/student-fees/student-fees.routes.js";

/**
 * Builds and wires the Fastify application: Zod-backed validation and
 * serialization, logging, security headers, CORS, OpenAPI docs, auth/RBAC,
 * rate limiting, uploads, a shared error handler, and the route modules. Kept
 * separate from `server.ts` so it can be imported directly by tests.
 */
export async function buildApp() {
  const app = Fastify({
    // Behind a platform proxy (Railway, and any load balancer) the socket IP is
    // the proxy's. Trusting X-Forwarded-For makes `request.ip` the real client
    // IP — essential for the per-IP login rate limit (otherwise every user
    // shares one IP and trips it together) and for accurate audit-log IPs.
    trustProxy: true,
    logger: {
      level: env.LOG_LEVEL,
      transport: env.isProduction
        ? undefined
        : {
            target: "pino-pretty",
            options: { translateTime: "HH:MM:ss Z", ignore: "pid,hostname" },
          },
    },
  }).withTypeProvider<ZodTypeProvider>();

  // Drive request validation and response serialization from the Zod schemas
  // declared on each route.
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Centralized error handler — every failure is shaped into `{ message, code }`
  // (plus `issues` for validation errors) to match the response envelope.
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        message: "Request validation failed",
        code: "VALIDATION_ERROR",
        issues: error.validation.map((issue) => ({
          path: issue.instancePath,
          message: issue.message,
        })),
      });
    }

    if (isResponseSerializationError(error)) {
      app.log.error(error, "Response serialization failed");
      return reply.status(500).send({ message: "Internal server error", code: "INTERNAL_ERROR" });
    }

    if (isAppError(error)) {
      if (error.statusCode >= 500) app.log.error(error);
      return reply.status(error.statusCode).send({
        message: error.message,
        code: error.code,
        ...(Array.isArray(error.details) ? { issues: error.details } : {}),
      });
    }

    // Translate the Prisma errors that can still slip past service-level checks.
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return reply.status(409).send({
          message: "A record with these details already exists",
          code: "CONFLICT",
        });
      }
      if (error.code === "P2025") {
        return reply.status(404).send({ message: "Resource not found", code: "NOT_FOUND" });
      }
    }

    app.log.error(error);
    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      message: statusCode >= 500 ? "Internal server error" : error.message,
      code: statusCode >= 500 ? "INTERNAL_ERROR" : error.code ?? "ERROR",
    });
  });

  // CSP is disabled so the bundled Swagger UI assets load; tighten this if the
  // API is ever served on a public origin. CORP is relaxed to cross-origin so
  // the frontend (different origin) can embed served avatar images in <img>.
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });
  await app.register(cors, {
    origin: env.corsOrigins,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  });

  // Infrastructure plugins.
  await app.register(swaggerPlugin);
  await app.register(prismaPlugin);
  await app.register(authPlugin);
  await app.register(rateLimitPlugin);
  await app.register(uploadsPlugin);
  await app.register(passExpiryPlugin);

  // Routes.
  await app.register(healthRoutes);
  await app.register(statusRoutes, { prefix: "/api" });
  // Presigned-URL proxy for private S3 objects (only when S3 is the driver).
  if (env.storageDriver === "s3") {
    await app.register(filesRoutes, { prefix: "/api" });
  }
  await app.register(authRoutes, { prefix: "/api" });
  await app.register(usersRoutes, { prefix: "/api" });
  await app.register(rolesRoutes, { prefix: "/api" });
  await app.register(permissionsRoutes, { prefix: "/api" });
  await app.register(profileRoutes, { prefix: "/api" });
  await app.register(companyRoutes, { prefix: "/api" });
  await app.register(holidaysRoutes, { prefix: "/api" });
  await app.register(auditLogsRoutes, { prefix: "/api" });
  await app.register(productCategoriesRoutes, { prefix: "/api" });
  await app.register(productsRoutes, { prefix: "/api" });
  await app.register(paymentMethodsRoutes, { prefix: "/api" });
  await app.register(billingRoutes, { prefix: "/api" });
  await app.register(dashboardRoutes, { prefix: "/api" });
  await app.register(passTypesRoutes, { prefix: "/api" });
  await app.register(passesRoutes, { prefix: "/api" });
  await app.register(trainingTypesRoutes, { prefix: "/api" });
  await app.register(trainingProgramsRoutes, { prefix: "/api" });
  await app.register(feePlansRoutes, { prefix: "/api" });
  await app.register(batchesRoutes, { prefix: "/api" });
  await app.register(enrollmentsRoutes, { prefix: "/api" });
  await app.register(attendanceRoutes, { prefix: "/api" });
  await app.register(studentFeesRoutes, { prefix: "/api" });

  return app;
}
