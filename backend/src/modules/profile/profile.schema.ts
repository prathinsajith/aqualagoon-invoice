import { z } from "zod";
import { genderSchema, userSchema } from "../users/users.schema.js";

/** A user may edit only their own personal details — never roles/status/email. */
export const updateProfileBody = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    phone: z.string().trim().min(3).max(30).nullable(),
    gender: genderSchema.nullable(),
    dateOfBirth: z.coerce.date().nullable(),
    address: z.string().trim().max(500).nullable(),
  })
  .partial();

export const profileResponse = z.object({ data: userSchema });
