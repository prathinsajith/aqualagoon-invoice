import {
  type Icon,
  IconLayoutDashboard,
  IconReceipt,
  IconTicket,
  IconUsersGroup,
  IconUserCircle,
  IconSettings,
  IconHelp,
  IconSearch,
  IconCalendar,
  IconAnalyze,
  IconChartBar,
} from "@tabler/icons-react";

/**
 * Static map of the icons referenced by NAVBAR_DATA (`lib/constant.ts`).
 *
 * The nav stores its icon as a string name, so we resolve it through this
 * explicit map instead of `import * as TablerIcons` + dynamic lookup — a
 * namespace import defeats tree-shaking and pulls the entire ~5,000-icon
 * library into the shared bundle on every page. Add an entry here when you add
 * a new icon name to the nav data.
 */
const NAV_ICONS: Record<string, Icon> = {
  IconLayoutDashboard,
  IconReceipt,
  IconTicket,
  IconUsersGroup,
  IconUserCircle,
  IconSettings,
  IconHelp,
  IconSearch,
  IconCalendar,
  IconAnalyze,
  IconChartBar,
};

/** Resolves a nav icon name to its component, or null if unknown. */
export function navIcon(name: string | undefined | null): Icon | null {
  return name ? NAV_ICONS[name] ?? null : null;
}
