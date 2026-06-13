import { IconLock } from "@tabler/icons-react";

/** Shown in place of a page's content when the user lacks permission. */
export function NoAccess({ message = "You don't have permission to view this page." }: { message?: string }) {
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <IconLock className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
                <p className="text-lg font-semibold">Access denied</p>
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
        </div>
    );
}
