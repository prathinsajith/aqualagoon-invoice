import { z } from "zod";

/** Public shape of a holiday. */
export const holidaySchema = z.object({
  id: z.string(),
  date: z.string(),
  name: z.string().nullable(),
  createdAt: z.date(),
});

export const holidaysResponse = z.object({ data: z.array(holidaySchema) });
export const holidayResponse = z.object({ data: holidaySchema });
export const messageResponse = z.object({ data: z.object({ message: z.string() }) });

export const createHolidayBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  name: z.string().trim().max(120).nullish(),
});

export const holidayIdParams = z.object({ id: z.uuid() });

export type CreateHolidayInput = z.infer<typeof createHolidayBody>;
