import { IconUser } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarColor, initialsOf } from "@/lib/avatar";
import { resolveMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * A person's avatar: shows their uploaded photo, falling back to stable
 * colour-coded initials (keyed by `seed`), then a generic user icon when there
 * are no initials. Used everywhere a user/holder/buyer is listed so the look
 * stays identical across the app.
 */
export function PersonAvatar({
  name,
  photoUrl,
  seed,
  className,
  textClassName = "text-xs",
}: {
  name: string;
  photoUrl?: string | null;
  /** Colour seed (e.g. a user id) so the same person always gets the same colour. */
  seed?: string | null;
  className?: string;
  textClassName?: string;
}) {
  const photo = resolveMediaUrl(photoUrl);
  const [first, last] = (name ?? "").split(" ");
  const initials = initialsOf(first, last);

  return (
    <Avatar className={cn("ring-1 ring-border", className)}>
      <AvatarImage src={photo} alt={name} className="object-cover" />
      <AvatarFallback className={cn("font-semibold", textClassName, avatarColor(seed || name || "?"))}>
        {initials || <IconUser className="size-1/2" stroke={1.8} />}
      </AvatarFallback>
    </Avatar>
  );
}
