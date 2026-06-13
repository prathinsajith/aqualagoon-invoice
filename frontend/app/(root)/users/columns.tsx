"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconArchive,
  IconRestore,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateText } from "@/components/date-text";
import { avatarColor, initialsOf } from "@/lib/avatar";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserStatusBadge } from "@/components/rbac/status-badge";
import type { ManagedUser } from "@/types/rbac";

interface ColumnHandlers {
  onView: (user: ManagedUser) => void;
  onEdit: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
  onRestore: (user: ManagedUser) => void;
  can: (permission: string) => boolean;
  /** The signed-in user's id — used to prevent archiving your own account. */
  currentUserId?: string | null;
}

export function getUserColumns({
  onView,
  onEdit,
  onDelete,
  onRestore,
  can,
  currentUserId,
}: ColumnHandlers): ColumnDef<ManagedUser>[] {
  return [
    {
      accessorKey: "userCode",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.userCode}</span>
      ),
    },
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => {
        const u = row.original;
        const photo = u.photoUrl
          ? u.photoUrl.startsWith("http")
            ? u.photoUrl
            : `${env.apiUrl}${u.photoUrl}`
          : undefined;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarImage src={photo} alt={u.firstName} className="object-cover" />
              <AvatarFallback className={cn("text-xs font-semibold", avatarColor(u.id))}>
                {initialsOf(u.firstName, u.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">
                {u.firstName} {u.lastName}
              </span>
              <span className="text-xs text-muted-foreground">{u.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "roles",
      header: "Roles",
      cell: ({ row }) => {
        const roles = row.original.roles;
        if (roles.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((r) => (
              <Badge key={r.id} variant="secondary" className="font-normal">
                {r.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm">
          <DateText value={row.original.createdAt} />
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        const isArchived = !!user.deletedAt;
        const isSelf = !!currentUserId && user.id === currentUserId;
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <IconDotsVertical className="size-4" />
                  <span className="sr-only">Open actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(user)}>
                  <IconEye className="size-4" /> View
                </DropdownMenuItem>
                {can("user.update") && !isArchived && (
                  <DropdownMenuItem onClick={() => onEdit(user)}>
                    <IconPencil className="size-4" /> Edit
                  </DropdownMenuItem>
                )}
                {can("user.restore") && isArchived && (
                  <DropdownMenuItem onClick={() => onRestore(user)}>
                    <IconRestore className="size-4" /> Restore
                  </DropdownMenuItem>
                )}
                {can("user.delete") && !isArchived && !isSelf && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(user)}>
                      <IconArchive className="size-4" /> Archive
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
