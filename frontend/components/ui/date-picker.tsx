"use client";

import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { IconCalendar } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  /** Value as an ISO date string (yyyy-MM-dd). */
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  /** Earliest selectable month. Defaults to Jan 1940 (good for dates of birth). */
  startMonth?: Date;
  /** Latest selectable month. Defaults to the current month (no future dates). */
  endMonth?: Date;
  className?: string;
}

/** Ten years ahead — a sensible upper bound for forward-looking pickers. */
const TEN_YEARS_AHEAD = new Date(new Date().getFullYear() + 10, 11);
/** Five years back — a sensible lower bound for forward-looking pickers. */
const FIVE_YEARS_BACK = new Date(new Date().getFullYear() - 5, 0);

/** shadcn date picker: a Popover + Calendar, controlled by a `yyyy-MM-dd` string. */
export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  id,
  disabled,
  startMonth = new Date(1940, 0),
  endMonth = new Date(),
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start gap-2 font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <IconCalendar className="size-4 opacity-70" />
          {selected ? format(selected, "PP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          captionLayout="dropdown"
          startMonth={startMonth}
          endMonth={endMonth}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

/** Range bounds for forward-looking pickers (batch dates, due dates, attendance). */
export { TEN_YEARS_AHEAD as DATE_PICKER_FUTURE_END, FIVE_YEARS_BACK as DATE_PICKER_PAST_START };
