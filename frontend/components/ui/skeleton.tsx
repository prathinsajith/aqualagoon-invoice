import { cn } from "@/lib/utils";

/**
 * Base shimmer block. Compose these to mirror the shape of the content that's
 * loading (text lines, avatars, table cells) so the layout doesn't jump when
 * real data arrives.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted/70", className)}
      {...props}
    />
  );
}

export { Skeleton };
