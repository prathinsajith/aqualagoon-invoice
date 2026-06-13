"use client";

import { useState } from "react";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { IconCalendar, IconChevronDown } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDateFormat } from "@/hooks/useCompany";
import { cn } from "@/lib/utils";
import {
  RANGE_PRESETS,
  rangeLabel,
  resolveCustom,
  type RangePreset,
  type RangeValue,
} from "@/lib/date-range";

export function DateRangeFilter({
  value,
  onChange,
  disabled,
}: {
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(value.preset === "custom");
  const { formatDate } = useDateFormat();

  const triggerLabel =
    value.preset === "custom" && value.custom
      ? `${formatDate(value.custom.from)} – ${formatDate(value.custom.to)}`
      : rangeLabel(value.preset);

  const selectPreset = (preset: RangePreset) => {
    setShowCustom(false);
    onChange({ preset });
    setOpen(false);
  };

  const selectCustom = (range: DayPickerRange | undefined) => {
    if (range?.from && range.to) {
      onChange({ preset: "custom", custom: resolveCustom(range.from, range.to) });
      setOpen(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setShowCustom(value.preset === "custom");
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 gap-2 font-medium" disabled={disabled}>
          <IconCalendar className="size-4 text-muted-foreground" />
          {triggerLabel}
          <IconChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto overflow-hidden p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Presets */}
          <div className="flex flex-col gap-0.5 border-b p-2 sm:w-44 sm:border-b-0 sm:border-r">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => selectPreset(p.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                  value.preset === p.value && "bg-primary/10 font-medium text-primary",
                )}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className={cn(
                "rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                value.preset === "custom" && "bg-primary/10 font-medium text-primary",
              )}
            >
              Custom range
            </button>
          </div>

          {/* Custom calendar (range mode) */}
          {showCustom && (
            <div className="p-2">
              <Calendar
                mode="range"
                numberOfMonths={1}
                defaultMonth={value.custom?.from}
                selected={
                  value.custom
                    ? { from: value.custom.from, to: value.custom.to }
                    : undefined
                }
                onSelect={selectCustom}
                autoFocus
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
