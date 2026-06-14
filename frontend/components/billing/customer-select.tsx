"use client";

import { useState } from "react";
import { IconUser, IconSearch, IconPlus, IconX, IconChevronDown } from "@tabler/icons-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Can } from "@/components/permission-gate";
import { UserFormDialog } from "@/app/(root)/users/user-form-dialog";
import { useUsers } from "@/hooks/queries/use-users";
import { useDebounce } from "@/hooks/use-debounce";
import { avatarColor, initialsOf } from "@/lib/avatar";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { ManagedUser } from "@/types/rbac";

const photoUrl = (url: string | null): string | undefined =>
  url ? (url.startsWith("http") ? url : `${env.apiUrl}${url}`) : undefined;

/** Avatar for a customer (photo or deterministic coloured initials). */
function CustomerAvatar({ user, className }: { user: ManagedUser; className?: string }) {
  return (
    <Avatar className={cn("size-9", className)}>
      <AvatarImage src={photoUrl(user.photoUrl)} alt={user.firstName} className="object-cover" />
      <AvatarFallback className={cn("text-xs font-semibold", avatarColor(user.id))}>
        {initialsOf(user.firstName, user.lastName)}
      </AvatarFallback>
    </Avatar>
  );
}

export function CustomerSelect({
  value,
  onChange,
  className,
  invalid,
}: {
  value: ManagedUser | null;
  onChange: (user: ManagedUser | null) => void;
  className?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const search = useDebounce(searchInput, 300);

  const { data, isFetching } = useUsers({ page: 1, limit: 8, search: search || undefined });
  const users = data?.data ?? [];

  const select = (user: ManagedUser | null) => {
    onChange(user);
    setOpen(false);
    setSearchInput("");
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-gray-50/50 px-3 text-left text-sm shadow-xs transition-colors hover:bg-muted/40 dark:bg-input/30",
              invalid && "border-destructive ring-[3px] ring-destructive/20",
              className,
            )}
          >
            {value ? (
              <CustomerAvatar user={value} className="size-6" />
            ) : (
              <IconUser className="size-4 shrink-0 text-muted-foreground" />
            )}

            <span
              className={cn(
                "min-w-0 flex-1 truncate font-medium",
                !value && "text-muted-foreground",
              )}
            >
              {value ? `${value.firstName} ${value.lastName}` : "Select customer"}
            </span>

            {value?.roles[0] && (
              <Badge variant="secondary" className="shrink-0 font-normal">
                {value.roles[0].name}
              </Badge>
            )}

            {value ? (
              <IconX
                className="size-4 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  select(null);
                }}
              />
            ) : (
              <IconChevronDown className="size-4 shrink-0 text-muted-foreground/60" />
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          collisionPadding={12}
          className="flex max-h-[60vh] w-[var(--radix-popover-trigger-width)] min-w-72 flex-col overflow-hidden border p-0"
        >
          <div className="relative shrink-0 border-b p-2">
            <IconSearch className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              autoFocus
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, phone or email…"
              className="h-9 pl-9"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-1">
            {isFetching && users.length === 0 ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">No customers found</p>
            ) : (
              users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => select(u)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted",
                    value?.id === u.id && "bg-muted",
                  )}
                >
                  <CustomerAvatar user={u} className="size-8" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[u.phone, u.email].filter(Boolean).join(" · ") || "No contact"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {u.roles.slice(0, 2).map((r) => (
                      <Badge key={r.id} variant="secondary" className="font-normal">
                        {r.name}
                      </Badge>
                    ))}
                  </div>
                </button>
              ))
            )}
          </div>

          <Can permission="user.create">
            <div className="shrink-0 border-t p-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setOpen(false);
                  setAddOpen(true);
                }}
              >
                <IconPlus className="size-4" /> Add new customer
              </Button>
            </div>
          </Can>
        </PopoverContent>
      </Popover>

      <UserFormDialog open={addOpen} onOpenChange={setAddOpen} onCreated={(u) => select(u)} />
    </>
  );
}
