"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navIcon } from "@/lib/nav-icons";
import { NAVBAR_DATA } from "@/lib/constant";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

/**
 * Fixed bottom tab bar shown on small screens (hidden at `lg`+, where the
 * header nav takes over). Mirrors the header's permission-gated items.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { can, isAdmin } = usePermissions();

  const items = NAVBAR_DATA.navMain.filter(
    (item) => (!item.permission || can(item.permission)) && (!item.adminOnly || isAdmin),
  );

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 lg:hidden",
        // Glass surface with curved top edges and a soft lift off the page.
        "rounded-t-[28px] border-t border-white/15 dark:border-white/10",
        "bg-background/65 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/55",
        "shadow-[0_-10px_40px_-12px_rgba(0,0,0,0.25)]",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-screen-sm items-stretch justify-around gap-1 px-2.5 pb-1.5 pt-2 sm:gap-2 sm:px-4">
        {items.map((item) => {
          const IconComponent = navIcon(item.icon);
          const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);

          return (
            <Link
              key={item.title}
              href={item.url}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-1.5 py-2 text-[11px] font-medium",
                "transition-all duration-200 active:scale-[0.92]",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {/* Glass pill behind the active item. */}
              <span
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset transition-all duration-200",
                  isActive
                    ? "bg-primary/12 ring-primary/25 shadow-sm"
                    : "bg-transparent ring-transparent group-hover:bg-foreground/5 group-active:bg-foreground/10",
                )}
              />
              {IconComponent && (
                <IconComponent
                  className="relative size-[22px] transition-transform duration-200 group-active:scale-110"
                  stroke={isActive ? 2 : 1.75}
                />
              )}
              <span className="relative leading-none">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
