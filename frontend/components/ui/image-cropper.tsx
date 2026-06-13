"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { IconZoomIn, IconZoomOut } from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/** Loads an image element from a source URL (object URL — same-origin). */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.src = src;
  });
}

/** Crops `src` to `area` (in source pixels) and returns a square-ish JPEG file. */
async function cropToFile(src: string, area: Area, fileName: string): Promise<File> {
  const image = await loadImage(src);
  const max = 512;
  const scale = Math.min(1, max / Math.max(area.width, area.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width * scale);
  canvas.height = Math.round(area.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  // JPEG has no alpha — paint white first so transparent source pixels don't
  // turn black in the exported image.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Crop failed"))), "image/jpeg", 0.92),
  );
  return new File([blob], fileName, { type: "image/jpeg" });
}

interface ImageCropperProps {
  /** Object URL of the source image; null closes the dialog. */
  src: string | null;
  /** Crop aspect ratio (width / height). Defaults to 1 (square). */
  aspect?: number;
  /** "round" for avatars, "rect" for logos. */
  cropShape?: "round" | "rect";
  onCancel: () => void;
  onCropped: (file: File) => void | Promise<void>;
}

/** Modal image cropper (pan + zoom) that returns a cropped JPEG File. */
export function ImageCropper({
  src,
  aspect = 1,
  cropShape = "round",
  onCancel,
  onCropped,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onComplete = useCallback((_: Area, pixels: Area) => setAreaPixels(pixels), []);

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreaPixels(null);
  };

  const handleSave = async () => {
    if (!src || !areaPixels) return;
    setSaving(true);
    try {
      const file = await cropToFile(src, areaPixels, "image.jpg");
      await onCropped(file);
      reset();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={!!src}
      onOpenChange={(o) => {
        if (!o && !saving) {
          reset();
          onCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop image</DialogTitle>
        </DialogHeader>

        <div className="relative h-72 w-full overflow-hidden rounded-lg bg-muted">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onComplete}
            />
          )}
        </div>

        <div className="flex items-center gap-3 px-1">
          <IconZoomOut className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer accent-primary"
            aria-label="Zoom"
          />
          <IconZoomIn className="size-4 shrink-0 text-muted-foreground" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !areaPixels}>
            {saving ? <Spinner /> : "Crop & save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
