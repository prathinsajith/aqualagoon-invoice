import type { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  attendanceSchema,
  attendanceSummarySchema,
  bulkMarkAttendanceBody,
  listAttendanceQuery,
  markAttendanceBody,
  updateAttendanceBody,
} from "./attendance.schema.js";

export type AttendanceDto = z.infer<typeof attendanceSchema>;
export type AttendanceSummaryDto = z.infer<typeof attendanceSummarySchema>;
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuery>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceBody>;
export type BulkMarkAttendanceInput = z.infer<typeof bulkMarkAttendanceBody>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceBody>;

export const attendanceInclude = {
  student: { select: { id: true, firstName: true, lastName: true } },
  batch: { select: { id: true, name: true } },
} satisfies Prisma.AttendanceInclude;

export type AttendanceWithRelations = Prisma.AttendanceGetPayload<{
  include: typeof attendanceInclude;
}>;

export function toAttendanceDto(a: AttendanceWithRelations): AttendanceDto {
  return {
    id: a.id,
    student: {
      id: a.student.id,
      firstName: a.student.firstName,
      lastName: a.student.lastName,
    },
    batch: { id: a.batch.id, name: a.batch.name },
    attendanceDate: a.attendanceDate,
    checkIn: a.checkIn,
    checkOut: a.checkOut,
    status: a.status,
    markedBy: a.markedBy,
    createdAt: a.createdAt,
  };
}
