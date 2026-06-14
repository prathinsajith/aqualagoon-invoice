import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { commonErrors } from "../../lib/response.js";
import type { ActorContext } from "../users/users.service.js";
import { HolidaysService } from "./holidays.service.js";
import {
  createHolidayBody,
  holidayIdParams,
  holidayResponse,
  holidaysResponse,
  messageResponse,
} from "./holidays.schema.js";
import type { CreateHolidayInput } from "./holidays.schema.js";

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export async function holidaysRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const service = new HolidaysService(app.prisma);

  const tags = ["holidays"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/holidays",
    {
      // Readable by any authenticated user — the attendance screen (trainers,
      // staff) needs it to show the holiday banner. Writes stay admin-only.
      preHandler: [app.authenticate],
      schema: { tags, summary: "List company holidays", security, response: { 200: holidaysResponse, ...commonErrors } },
    },
    async () => ({ data: await service.list() }),
  );

  r.post(
    "/holidays",
    {
      preHandler: [app.authenticate, app.requirePermission("setting.manage")],
      schema: {
        tags,
        summary: "Add a holiday date",
        security,
        body: createHolidayBody,
        response: { 200: holidayResponse, ...commonErrors },
      },
    },
    async (request: FastifyRequest<{ Body: CreateHolidayInput }>) => ({
      data: await service.create(request.body, actorOf(request)),
    }),
  );

  r.delete(
    "/holidays/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("setting.manage")],
      schema: {
        tags,
        summary: "Remove a holiday date",
        security,
        params: holidayIdParams,
        response: { 200: messageResponse, ...commonErrors },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>) => {
      await service.remove(request.params.id, actorOf(request));
      return { data: { message: "Holiday removed" } };
    },
  );
}
