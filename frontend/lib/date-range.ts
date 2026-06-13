import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subWeeks,
  subYears,
} from "date-fns";

/** Identifiers for the dashboard date-range presets. */
export type RangePreset =
  | "all"
  | "today"
  | "yesterday"
  | "last7"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "thisYear"
  | "lastYear"
  | "custom";

/** A resolved, inclusive date window. */
export interface DateRange {
  from: Date;
  to: Date;
}

/** Weeks start on Monday across the app. */
const WEEK_OPTS = { weekStartsOn: 1 as const };

/** Preset menu metadata, in display order. `custom` is handled separately. */
export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 days" },
  { value: "thisWeek", label: "This week" },
  { value: "lastWeek", label: "Last week" },
  { value: "thisMonth", label: "This month" },
  { value: "thisYear", label: "This year" },
  { value: "lastYear", label: "Last year" },
];

/** The default selection when the dashboard first loads. */
export const DEFAULT_PRESET: Exclude<RangePreset, "custom"> = "today";

/** Resolves a preset (relative to `now`) into a concrete inclusive window. */
export function resolvePreset(preset: Exclude<RangePreset, "custom">, now: Date = new Date()): DateRange {
  switch (preset) {
    case "all":
      // Effectively unbounded — covers every record without a real window.
      return { from: new Date(0), to: new Date(Date.UTC(2999, 11, 31, 23, 59, 59, 999)) };
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const prev = subDays(now, 1);
      return { from: startOfDay(prev), to: endOfDay(prev) };
    }
    case "last7":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "thisWeek":
      return { from: startOfWeek(now, WEEK_OPTS), to: endOfWeek(now, WEEK_OPTS) };
    case "lastWeek": {
      const prev = subWeeks(now, 1);
      return { from: startOfWeek(prev, WEEK_OPTS), to: endOfWeek(prev, WEEK_OPTS) };
    }
    case "thisMonth":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "thisYear":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "lastYear": {
      const prev = subYears(now, 1);
      return { from: startOfYear(prev), to: endOfYear(prev) };
    }
  }
}

/** Normalises a custom from/to selection into a sorted, day-bounded window. */
export function resolveCustom(from: Date, to: Date): DateRange {
  const [a, b] = from <= to ? [from, to] : [to, from];
  return { from: startOfDay(a), to: endOfDay(b) };
}

/** Serialises a window into query params for the dashboard API. */
export function toRangeParams(range: DateRange): { from: string; to: string } {
  return { from: range.from.toISOString(), to: range.to.toISOString() };
}

/** Human label for the active selection (used in widget captions). */
export function rangeLabel(preset: RangePreset): string {
  if (preset === "custom") return "Custom range";
  return RANGE_PRESETS.find((p) => p.value === preset)?.label ?? "Today";
}

/** A selected window: a named preset, or a custom from/to pair. */
export interface RangeValue {
  preset: RangePreset;
  custom?: DateRange;
}

/** Resolves a {@link RangeValue} into the concrete window used for queries. */
export function resolveRangeValue(value: RangeValue): DateRange {
  if (value.preset === "custom" && value.custom) return value.custom;
  return resolvePreset(value.preset === "custom" ? DEFAULT_PRESET : value.preset);
}
