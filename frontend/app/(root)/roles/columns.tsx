"use client";

import { ColumnDef } from "@tanstack/react-table";
import { IconDotsVertical, IconEye, IconPencil, IconTrash, IconLock } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/types/rbac";

interface ColumnHandlers {
  onView: (role: Role) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  can: (permission: string) => boolean;
}

export function getRoleColumns({ onView, onEdit, onDelete, can }: ColumnHandlers): ColumnDef<Role>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.name}</span>
          {row.original.isSystem && (
            <Badge variant="outline" className="gap-1 text-xs">
              <IconLock className="size-3" /> System
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.description || "—"}</span>
      ),
    },
    {
      accessorKey: "usersCount",
      header: "Users",
      cell: ({ row }) => <Badge variant="secondary">{row.original.usersCount}</Badge>,
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: ({ row }) => <span className="text-sm">{row.original.permissions.length}</span>,
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <IconDotsVertical className="size-4" />
                  <span className="sr-only">Open actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(role)}>
                  <IconEye className="size-4" /> View
                </DropdownMenuItem>
                {can("role.update") && (
                  <DropdownMenuItem onClick={() => onEdit(role)}>
                    <IconPencil className="size-4" /> Edit
                  </DropdownMenuItem>
                )}
                {can("role.delete") && !role.isSystem && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(role)}>
                      <IconTrash className="size-4" /> Delete
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
