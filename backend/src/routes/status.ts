import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

/** Shape returned to clients for a single status row. */
const statusSchema = z.object({
  id: z.number().int(),
  label: z.string(),
  colorCode: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const createStatusBody = z.object({
  label: z.string().min(1),
  colorCode: z.string().min(1),
});

const updateStatusBody = createStatusBody.partial();

const idParams = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

const listResponse = z.object({
  data: z.array(statusSchema),
  meta: z.object({
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      totalItems: z.number().int(),
      totalPages: z.number().int(),
    }),
  }),
});

const notFound = z.object({ message: z.string() });

/**
 * Example CRUD resource backed by Prisma, mounted under `/api`. Validation and
 * serialization are driven entirely by the Zod schemas attached to each route,
 * which also feed the OpenAPI docs at `/docs`.
 */
export async function statusRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // Every status route requires a valid session — this resource was previously
  // unauthenticated, allowing anonymous CRUD. The hook is scoped to this
  // encapsulated plugin, so it gates all routes below in one place.
  app.addHook("onRequest", app.authenticate);

  r.get(
    "/status",
    {
      schema: {
        tags: ["status"],
        summary: "List statuses (paginated)",
        querystring: listQuery,
        response: { 200: listResponse },
      },
    },
    async (request) => {
      const { page, limit } = request.query;
      const skip = (page - 1) * limit;

      const [data, totalItems] = await Promise.all([
        app.prisma.status.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        app.prisma.status.count(),
      ]);

      return {
        data,
        meta: {
          pagination: {
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
          },
        },
      };
    },
  );

  r.get(
    "/status/:id",
    {
      schema: {
        tags: ["status"],
        summary: "Get a status by id",
        params: idParams,
        response: { 200: statusSchema, 404: notFound },
      },
    },
    async (request, reply) => {
      const status = await app.prisma.status.findUnique({
        where: { id: request.params.id },
      });
      if (!status) {
        return reply.status(404).send({ message: "Status not found" });
      }
      return status;
    },
  );

  r.post(
    "/status",
    {
      schema: {
        tags: ["status"],
        summary: "Create a status",
        body: createStatusBody,
        response: { 201: statusSchema },
      },
    },
    async (request, reply) => {
      const status = await app.prisma.status.create({ data: request.body });
      return reply.status(201).send(status);
    },
  );

  r.put(
    "/status/:id",
    {
      schema: {
        tags: ["status"],
        summary: "Update a status",
        params: idParams,
        body: updateStatusBody,
        response: { 200: statusSchema },
      },
    },
    async (request) => {
      return app.prisma.status.update({
        where: { id: request.params.id },
        data: request.body,
      });
    },
  );

  r.delete(
    "/status/:id",
    {
      schema: {
        tags: ["status"],
        summary: "Delete a status",
        params: idParams,
      },
    },
    async (request, reply) => {
      await app.prisma.status.delete({ where: { id: request.params.id } });
      return reply.status(204).send();
    },
  );
}
