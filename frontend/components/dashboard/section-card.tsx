import type { ReactNode } from "react";
import Link from "next/link";
import { IconChevronRight, type IconProps } from "@tabler/icons-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TablerIcon = (props: IconProps) => ReactNode;

/**
 * Shared layout for the dashboard's list cards: a leading tinted icon chip, a
 * title with optional caption, and an optional trailing action (e.g. a
 * "View all" link). Keeps every section visually consistent.
 */
export function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  caption,
  action,
  children,
  contentClassName,
}: {
  icon: TablerIcon;
  iconClassName: string;
  title: string;
  caption?: string;
  action?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      {/* Force flex over CardHeader's default grid so the icon and title sit inline. */}
      <CardHeader className="flex! flex-row items-center gap-3 space-y-0">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            iconClassName,
          )}
        >
          <Icon className="size-5" stroke={1.6} />
        </span>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {caption && <p className="truncate text-xs text-muted-foreground">{caption}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

/** Standard trailing "View all" link used by the section cards. */
export function ViewAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
    >
      View all <IconChevronRight className="size-4" />
    </Link>
  );
}
