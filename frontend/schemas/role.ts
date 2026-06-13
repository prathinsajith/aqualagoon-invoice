import { z } from "zod";

export const roleFormSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    description: z.string().trim().max(500).optional().or(z.literal("")),
    permissionIds: z.array(z.string()),
});
export type RoleFormSchema = z.infer<typeof roleFormSchema>;
