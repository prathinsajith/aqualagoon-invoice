import type { FastifyRequest } from "fastify";
import type { ActorContext } from "../users/users.service.js";
import type { AttendanceService } from "./attendance.service.js";
import type {
  BulkMarkAttendanceInput,
  ListAttendanceQuery,
  MarkAttendanceInput,
  UpdateAttendanceInput,
} from "./attendance.types.js";

type IdParams = { id: string };
type SummaryQuery = {
  studentId?: string;
  batchId?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

const actorOf = (request: FastifyRequest): ActorContext => ({
  userId: request.currentUser?.id ?? null,
  roles: request.currentUser?.roles ?? [],
  ip: request.ip,
});

export function createAttendanceController(service: AttendanceService) {
  return {
    list: async (request: FastifyRequest<{ Querystring: ListAttendanceQuery }>) => {
      return service.list(request.query);
    },

    mark: async (request: FastifyRequest<{ Body: MarkAttendanceInput }>) => {
      return { data: await service.mark(request.body, actorOf(request)) };
    },

    bulkMark: async (request: FastifyRequest<{ Body: BulkMarkAttendanceInput }>) => {
      return { data: await service.bulkMark(request.body, actorOf(request)) };
    },

    update: async (
      request: FastifyRequest<{ Params: IdParams; Body: UpdateAttendanceInput }>,
    ) => {
      return { data: await service.update(request.params.id, request.body, actorOf(request)) };
    },

    summary: async (request: FastifyRequest<{ Querystring: SummaryQuery }>) => {
      return { data: await service.summary(request.query) };
    },
  };
}
