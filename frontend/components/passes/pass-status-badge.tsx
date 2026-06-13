import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PASS_STATUS_LABELS } from "@/lib/pass-format";
import type { UserPassStatus } from "@/types/pass";

const STATUS_STYLES: Record<UserPassStatus, string> = {
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    EXPIRED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    SUSPENDED: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

export function PassStatusBadge({ status }: { status: UserPassStatus }) {
    return (
        <Badge variant="outline" className={cn("border-transparent", STATUS_STYLES[status])}>
            {PASS_STATUS_LABELS[status]}
        </Badge>
    );
}
