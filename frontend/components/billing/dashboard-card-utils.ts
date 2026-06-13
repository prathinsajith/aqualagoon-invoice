import type { DateRange } from "@/lib/date-range";

/** Stable query-key fragment for a date window. */
export const rangeKey = (range: DateRange) => [range.from.toISOString(), range.to.toISOString()];

/** Shared props for the range-scoped dashboard cards. */
export interface DashboardRangeProps {
  range: DateRange;
  periodLabel: string;
}
