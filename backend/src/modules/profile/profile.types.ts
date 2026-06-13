import type { z } from "zod";
import type { updateProfileBody } from "./profile.schema.js";

export type UpdateProfileInput = z.infer<typeof updateProfileBody>;
