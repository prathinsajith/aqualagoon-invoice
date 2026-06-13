"use client";

import * as TablerIcons from "@tabler/icons-react";
import { type Icon } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAVBAR_DATA } from "@/lib/constant";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

/**
 * Fixed bottom tab bar shown on small screens (hidden at `lg`+, where the
 * header nav takes over). Mirrors the header's permission-gated items.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { can } = usePermissions();

  const items = NAVBAR_DATA.navMain.filter((item) => !item.permission || can(item.permission));

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-screen-sm items-stretch justify-around">
        {items.map((item) => {
          const IconComponent = item.icon
            ? (TablerIcons as unknown as Record<string, Icon>)[item.icon]
            : null;
          const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);

          return (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {IconComponent && <IconComponent className="size-[22px]" stroke={1.75} />}
              <span className="leading-none">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
