import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserStatus } from "@/stores/auth-store";

const STATUS_STYLES: Record<UserStatus, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    INACTIVE: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    SUSPENDED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
    return (
        <Badge variant="outline" className={cn("border-transparent", STATUS_STYLES[status])}>
            {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
    );
}
