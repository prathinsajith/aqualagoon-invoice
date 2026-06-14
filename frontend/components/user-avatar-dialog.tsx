"use client";

import * as React from "react";
import {
  IconLogout,
  IconSettings,
  IconHelpCircle,
  IconUser,
  IconBuildingStore,
  IconHistory,
  IconSun,
  IconMoon,
  IconDeviceDesktop,
} from "@tabler/icons-react";
import Link from "next/link";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/permission-gate";
import { usePermissions } from "@/hooks/usePermissions";
import { fullName, useAuthStore, type User } from "@/stores/auth-store";
import { env } from "@/lib/env";
import { avatarColor } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "system", label: "System", icon: IconDeviceDesktop },
] as const;

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  // Mount guard so the active theme highlight matches after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);
  const active = mounted ? theme : undefined;

  return (
    <div className="px-2.5 py-2">
      <p className="px-0.5 pb-1.5 text-xs font-medium text-muted-foreground">Theme</p>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/60 p-1">
        {THEMES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setTheme(value);
            }}
            className={cn(
              "flex flex-col items-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-colors",
              active === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function UserAvatarDialog({ user }: { user: User | null }) {
  const logout = useAuthStore((state) => state.logout);
  const { isAdmin } = usePermissions();

  const name = fullName(user) || "User";
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";
  const photo = user?.photoUrl
    ? user.photoUrl.startsWith("http")
      ? user.photoUrl
      : `${env.apiUrl}${user.photoUrl}`
    : undefined;
  const primaryRole = user?.roles[0];
  const fallbackColor = avatarColor(user?.id ?? user?.email ?? "user");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 rounded-full p-0 ring-2 ring-[var(--color-aqua-500)] ring-offset-2 ring-offset-background shadow-[0_0_0_4px_rgba(10,132,214,0.18)] transition hover:ring-[var(--color-aqua-400)] data-[state=open]:ring-[var(--color-aqua-600)]"
        >
          <Avatar className="size-9">
            <AvatarImage src={photo} alt={name} className="object-cover" />
            <AvatarFallback className={cn("text-sm font-medium", fallbackColor)}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-72 overflow-hidden rounded-2xl p-0" align="end" sideOffset={10}>
        {/* Header */}
        <div className="flex items-center gap-3 bg-gradient-to-br from-[var(--color-aqua-500)]/10 to-transparent px-4 py-4">
          <Avatar className="size-12 ring-2 ring-background shadow-sm">
            <AvatarImage src={photo} alt={name} className="object-cover" />
            <AvatarFallback className={cn("text-sm font-semibold", fallbackColor)}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold leading-tight">{name}</p>
              {primaryRole && (
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {primaryRole}
                </Badge>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <DropdownMenuSeparator className="my-0" />

        {/* Actions */}
        <div className="p-1.5">
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer gap-2.5 py-2">
              <IconUser className="size-4 text-muted-foreground" />
              My Profile
            </Link>
          </DropdownMenuItem>
          <Can permission="setting.manage">
            <DropdownMenuItem asChild>
              <Link href="/company" className="cursor-pointer gap-2.5 py-2">
                <IconBuildingStore className="size-4 text-muted-foreground" />
                Company
              </Link>
            </DropdownMenuItem>
          </Can>
          <Can permission="role.view">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer gap-2.5 py-2">
                <IconSettings className="size-4 text-muted-foreground" />
                Settings
              </Link>
            </DropdownMenuItem>
          </Can>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/audit-logs" className="cursor-pointer gap-2.5 py-2">
                <IconHistory className="size-4 text-muted-foreground" />
                Audit Logs
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/help" className="cursor-pointer gap-2.5 py-2">
              <IconHelpCircle className="size-4 text-muted-foreground" />
              Get Help
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-0" />

        {/* Theme */}
        <ThemeSwitcher />

        <DropdownMenuSeparator className="my-0" />

        <div className="p-1.5">
          <DropdownMenuItem
            variant="destructive"
            onClick={() => logout()}
            className="cursor-pointer gap-2.5 py-2"
          >
            <IconLogout className="size-4" />
            Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
