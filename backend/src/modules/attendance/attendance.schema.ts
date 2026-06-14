import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";

export const attendanceStatusSchema = z.enum(["PRESENT", "ABSENT", "LATE", "LEAVE"]);

const studentRefSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

const batchRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const attendanceSchema = z.object({
  id: z.string(),
  student: studentRefSchema,
  batch: batchRefSchema,
  attendanceDate: z.date(),
  checkIn: z.date().nullable(),
  checkOut: z.date().nullable(),
  status: attendanceStatusSchema,
  markedBy: z.string().nullable(),
  createdAt: z.date(),
});

export const attendanceIdParams = z.object({ id: z.uuid() });

export const listAttendanceQuery = paginationQuery.extend({
  // Higher cap than the shared default: a month grid pulls every record for a
  // batch over the period (students × days), which can exceed 100 rows.
  limit: z.coerce.number().int().positive().max(2000).default(10),
  batchId: z.uuid().optional(),
  studentId: z.uuid().optional(),
  status: attendanceStatusSchema.optional(),
  // Filter to a single day.
  attendanceDate: z.coerce.date().optional(),
  // Inclusive date window (ignored when attendanceDate is given).
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(["attendanceDate", "createdAt"]).default("attendanceDate"),
});

/** Mark a single student's attendance (upsert on student/batch/date). */
export const markAttendanceBody = z.object({
  studentId: z.uuid(),
  batchId: z.uuid(),
  attendanceDate: z.coerce.date(),
  status: attendanceStatusSchema,
  checkIn: z.coerce.date().nullish(),
  checkOut: z.coerce.date().nullish(),
});

/** Mark a whole batch at once for a single date. */
export const bulkMarkAttendanceBody = z.object({
  batchId: z.uuid(),
  attendanceDate: z.coerce.date(),
  records: z
    .array(
      z.object({
        studentId: z.uuid(),
        status: attendanceStatusSchema,
        checkIn: z.coerce.date().nullish(),
        checkOut: z.coerce.date().nullish(),
      }),
    )
    .min(1),
});

export const bulkMarkResultSchema = z.object({ marked: z.number().int() });

export const updateAttendanceBody = z.object({
  status: attendanceStatusSchema.optional(),
  checkIn: z.coerce.date().nullish(),
  checkOut: z.coerce.date().nullish(),
});

export const attendanceSummaryQuery = z.object({
  studentId: z.uuid().optional(),
  batchId: z.uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const attendanceSummarySchema = z.object({
  total: z.number().int(),
  present: z.number().int(),
  absent: z.number().int(),
  late: z.number().int(),
  leave: z.number().int(),
  percentage: z.number().int(),
});
