"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserStatusBadge } from "@/components/rbac/status-badge";
import { DateText } from "@/components/date-text";
import { env } from "@/lib/env";
import { avatarColor, initialsOf } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import type { ManagedUser } from "@/types/rbac";

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}

export function UserViewDialog({
  user,
  open,
  onOpenChange,
}: {
  user: ManagedUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!user) return null;

  const photo = user.photoUrl
    ? user.photoUrl.startsWith("http")
      ? user.photoUrl
      : `${env.apiUrl}${user.photoUrl}`
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        {/* Gradient header */}
        <div className="h-20 bg-gradient-to-r from-[var(--color-aqua-500)] via-[var(--color-aqua-600)] to-[var(--color-aqua-700)]" />

        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <Avatar className="size-20 ring-4 ring-card">
              <AvatarImage src={photo} alt={user.firstName} className="object-cover" />
              <AvatarFallback className={cn("text-xl font-semibold", avatarColor(user.id))}>
                {initialsOf(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1" />
            <UserStatusBadge status={user.status} />
          </div>

          <DialogHeader className="mt-3 space-y-1 text-left">
            <DialogTitle className="flex flex-wrap items-center gap-2">
              {user.firstName} {user.lastName}
              {user.roles.map((r) => (
                <Badge key={r.id} variant="secondary" className="text-[10px]">
                  {r.name}
                </Badge>
              ))}
            </DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Detail label="User code" value={user.userCode} />
            <Detail label="Phone" value={user.phone} />
            <Detail label="Gender" value={user.gender} />
            <Detail
              label="Date of birth"
              value={user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "—"}
            />
            <Detail label="Last login" value={<DateText value={user.lastLoginAt} withTime />} />
            <Detail label="Created" value={<DateText value={user.createdAt} />} />
            <div className="col-span-2">
              <Detail label="Address" value={user.address} />
            </div>
            {user.deletedAt && (
              <div className="col-span-2">
                <Detail label="Archived" value={<DateText value={user.deletedAt} withTime />} />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
