"use client";

import * as TablerIcons from "@tabler/icons-react";
import { type Icon } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavItem } from "@/lib/constant";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

interface MainNavProps {
  items: NavItem[];
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
}

/**
 * Primary navigation rendered in the header (horizontal) or the mobile sheet
 * (vertical). Entries are hidden when the user lacks the item's permission.
 */
export function MainNav({ items, orientation = "horizontal", onNavigate }: MainNavProps) {
  const pathname = usePathname();
  const { can, isAdmin } = usePermissions();

  const visible = items.filter(
    (item) => (!item.permission || can(item.permission)) && (!item.adminOnly || isAdmin),
  );
  const isHorizontal = orientation === "horizontal";

  return (
    <nav
      aria-label="Main navigation"
      className={cn(isHorizontal ? "flex items-center gap-1" : "flex flex-col gap-1")}
    >
      {visible.map((item) => {
        const IconComponent = item.icon
          ? (TablerIcons as unknown as Record<string, Icon>)[item.icon]
          : null;
        const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);

        return (
          <Link
            key={item.title}
            href={item.url}
            onClick={onNavigate}
            className={cn(
              "flex transition-colors",
              // Header: icon on top, label beneath. Mobile sheet: inline list row.
              isHorizontal
                ? "flex-col items-center gap-1 rounded-xl px-4 py-1.5"
                : "flex-row items-center gap-2.5 rounded-lg px-3 py-2.5",
              isActive
                ? "bg-primary/10 font-semibold text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {IconComponent && (
              <IconComponent className="size-5" stroke={1.75} />
            )}
            <span className={isHorizontal ? "text-[13px] font-medium leading-none" : "text-sm"}>
              {item.title}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
