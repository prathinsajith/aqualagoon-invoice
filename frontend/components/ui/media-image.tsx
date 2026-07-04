import Image, { type ImageProps } from "next/image";

import { isOptimizableMedia } from "@/lib/media";

/**
 * `next/image` for app-managed media (product photos, logos, etc.). It resizes
 * and serves modern formats for hosts we've allow-listed (the backend origin,
 * S3, an optional CDN — see next.config.ts), and transparently falls back to
 * `unoptimized` for any other host so the image always renders rather than
 * throwing a "hostname not configured" error.
 */
export function MediaImage({ src, ...props }: ImageProps & { src: string }) {
  return <Image src={src} {...props} unoptimized={!isOptimizableMedia(src)} />;
}
