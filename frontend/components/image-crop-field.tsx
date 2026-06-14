"use client";

import { useRef, useState } from "react";
import { IconCamera } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ImageCropper } from "@/components/ui/image-cropper";
import { cn } from "@/lib/utils";

interface ImageCropFieldProps {
  /** Current image URL (already resolved to an absolute/usable src). */
  value?: string;
  /** Called with the cropped JPEG file. */
  onCropped: (file: File) => void | Promise<void>;
  shape?: "circle" | "square";
  /** Shown inside the preview when there's no image. */
  fallback?: React.ReactNode;
  /** Tailwind size for the preview box (e.g. "size-24"). */
  sizeClass?: string;
  changeLabel?: string;
  busy?: boolean;
  className?: string;
}

/** Preview + "Change" button that opens an interactive cropper before upload. */
export function ImageCropField({
  value,
  onCropped,
  shape = "circle",
  fallback,
  sizeClass = "size-24",
  changeLabel = "Change",
  busy = false,
  className,
}: ImageCropFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCropSrc(URL.createObjectURL(file));
    if (fileRef.current) fileRef.current.value = "";
  };

  const clear = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const rounded = shape === "circle" ? "rounded-full" : "rounded-2xl";

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn(
          "grid place-items-center overflow-hidden border bg-muted/30",
          rounded,
          sizeClass,
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          fallback
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
      >
        {busy ? <Spinner className="size-4" /> : <IconCamera className="size-4" />}
        {busy ? "Uploading…" : changeLabel}
      </Button>
      <input ref={fileRef} type="file" accept="image/*" hidden aria-label={changeLabel} onChange={onPick} />

      <ImageCropper
        src={cropSrc}
        cropShape={shape === "circle" ? "round" : "rect"}
        onCancel={clear}
        onCropped={async (file) => {
          await onCropped(file);
          clear();
        }}
      />
    </div>
  );
}
