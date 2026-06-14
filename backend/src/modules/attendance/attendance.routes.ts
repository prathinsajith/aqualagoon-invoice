import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { commonErrors, dataResponse, paginatedResponse } from "../../lib/response.js";
import { AttendanceService } from "./attendance.service.js";
import { createAttendanceController } from "./attendance.controller.js";
import {
  attendanceIdParams,
  attendanceSchema,
  attendanceSummaryQuery,
  attendanceSummarySchema,
  bulkMarkAttendanceBody,
  bulkMarkResultSchema,
  listAttendanceQuery,
  markAttendanceBody,
  updateAttendanceBody,
} from "./attendance.schema.js";

export async function attendanceRoutes(app: FastifyInstance): Promise<void> {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const controller = createAttendanceController(new AttendanceService(app.prisma));

  const tags = ["attendance"];
  const security = [{ bearerAuth: [] }];

  r.get(
    "/attendance",
    {
      preHandler: [app.authenticate, app.requirePermission("attendance.view")],
      schema: {
        tags,
        summary: "List attendance (paginated; backs daily/batch/student views)",
        security,
        querystring: listAttendanceQuery,
        response: { 200: paginatedResponse(attendanceSchema), ...commonErrors },
      },
    },
    controller.list,
  );

  r.get(
    "/attendance/summary",
    {
      preHandler: [app.authenticate, app.requirePermission("attendance.view")],
      schema: {
        tags,
        summary: "Attendance summary (totals + percentage) for the given filters",
        security,
        querystring: attendanceSummaryQuery,
        response: { 200: dataResponse(attendanceSummarySchema), ...commonErrors },
      },
    },
    controller.summary,
  );

  r.post(
    "/attendance",
    {
      preHandler: [app.authenticate, app.requirePermission("attendance.create")],
      schema: {
        tags,
        summary: "Mark a single student's attendance (upsert)",
        security,
        body: markAttendanceBody,
        response: { 200: dataResponse(attendanceSchema), ...commonErrors },
      },
    },
    controller.mark,
  );

  r.post(
    "/attendance/bulk",
    {
      preHandler: [app.authenticate, app.requirePermission("attendance.create")],
      schema: {
        tags,
        summary: "Mark a whole batch's attendance for a date (bulk upsert)",
        security,
        body: bulkMarkAttendanceBody,
        response: { 200: dataResponse(bulkMarkResultSchema), ...commonErrors },
      },
    },
    controller.bulkMark,
  );

  r.put(
    "/attendance/:id",
    {
      preHandler: [app.authenticate, app.requirePermission("attendance.update")],
      schema: {
        tags,
        summary: "Update an attendance record (status / check-in / check-out)",
        security,
        params: attendanceIdParams,
        body: updateAttendanceBody,
        response: { 200: dataResponse(attendanceSchema), ...commonErrors },
      },
    },
    controller.update,
  );
}
