import type { z } from "zod";
import type { assignPermissionsBody, permissionSchema } from "./permissions.schema.js";

export type PermissionDto = z.infer<typeof permissionSchema>;
export type AssignPermissionsInput = z.infer<typeof assignPermissionsBody>;
