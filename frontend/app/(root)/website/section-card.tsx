"use client";

import { IconDeviceFloppy } from "@tabler/icons-react";
import { Can } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/** Shared shell for a website content section: heading + gated Save button. */
export function SectionCard({
    title,
    description,
    onSave,
    saving,
    children,
}: {
    title: string;
    description?: string;
    onSave: () => void;
    saving: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
                <Can permission="website.manage">
                    <Button onClick={onSave} disabled={saving} className="shrink-0">
                        {saving ? <Spinner className="size-4" /> : <IconDeviceFloppy className="size-4" />}
                        Save changes
                    </Button>
                </Can>
            </div>
            <div className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">{children}</div>
        </div>
    );
}

export function SectionLoading() {
    return (
        <div className="space-y-4">
            <div className="h-7 w-40 animate-pulse rounded bg-muted" />
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
    );
}
