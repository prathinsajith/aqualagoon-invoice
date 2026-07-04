"use client";

import { useRef, useState } from "react";
import { IconUpload } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSiteContentMutations } from "@/hooks/queries/use-site-content";
import { resolveMediaUrl } from "@/lib/media";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Preview + upload control for a website image (hero, logo, OG). Uploads to the
 * backend and calls `onChange` with the returned URL. Bundled website defaults
 * (`/assets/…`) can't be previewed from the admin origin, so they show a note.
 */
export function SiteImagePicker({
    value,
    onChange,
    label,
    aspect = "video",
    className,
}: {
    value: string;
    onChange: (url: string) => void;
    label: string;
    aspect?: "video" | "square";
    className?: string;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const { uploadImage } = useSiteContentMutations();

    const isDefault = value?.startsWith("/assets");
    const preview = isDefault ? undefined : resolveMediaUrl(value);
    const [busy, setBusy] = useState(false);

    const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (fileRef.current) fileRef.current.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
        if (file.size > MAX_BYTES) return toast.error("Image exceeds the 5 MB limit");
        setBusy(true);
        try {
            const url = await uploadImage.mutateAsync(file);
            onChange(url);
            toast.success(`${label} uploaded`);
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            <div
                className={cn(
                    "relative flex items-center justify-center overflow-hidden rounded-xl border bg-muted/30",
                    aspect === "square" ? "aspect-square max-w-[160px]" : "aspect-video",
                )}
            >
                {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt={label} className="size-full object-cover" />
                ) : (
                    <span className="px-3 text-center text-xs text-muted-foreground">
                        {isDefault ? "Using bundled website default" : "No image"}
                    </span>
                )}
            </div>
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
                {busy ? <Spinner className="size-4" /> : <IconUpload className="size-4" />}
                {busy ? "Uploading…" : `Change ${label.toLowerCase()}`}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
        </div>
    );
}
