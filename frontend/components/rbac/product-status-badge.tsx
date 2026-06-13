import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/types/product";

const STATUS_STYLES: Record<ProductStatus, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    INACTIVE: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
    return (
        <Badge variant="outline" className={cn("border-transparent", STATUS_STYLES[status])}>
            {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
    );
}
