"use client";

import * as React from "react";
import { IconCalendar, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MonthPickerProps {
  /** Value as `yyyy-MM`. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/** A clean month/year picker (Popover + month grid), controlled by a `yyyy-MM` string. */
export function MonthPicker({ value, onChange, id, disabled, className }: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selYear, selMonth] = value
    ? value.split("-").map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1];
  // The year currently being browsed in the popover (independent of the value).
  const [viewYear, setViewYear] = React.useState(selYear);

  const label = value ? `${FULL_MONTHS[selMonth - 1]} ${selYear}` : "Select month";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Reset the browsed year to the selected one each time it (re)opens.
        if (next) setViewYear(selYear);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("justify-start gap-2 font-normal", !value && "text-muted-foreground", className)}
        >
          <IconCalendar className="size-4 opacity-70" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 max-w-[calc(100vw-1.5rem)] p-3" align="start">
        <div className="mb-3 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setViewYear((y) => y - 1)}
          >
            <IconChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-semibold tabular-nums">{viewYear}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setViewYear((y) => y + 1)}
          >
            <IconChevronRight className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS.map((m, i) => {
            const isSelected = viewYear === selYear && i + 1 === selMonth;
            return (
              <Button
                key={m}
                type="button"
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                className="font-normal"
                onClick={() => {
                  onChange(`${viewYear}-${String(i + 1).padStart(2, "0")}`);
                  setOpen(false);
                }}
              >
                {m}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
