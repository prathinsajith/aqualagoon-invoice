"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const usesDropdown = typeof captionLayout === "string" && captionLayout.startsWith("dropdown");
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full h-9",
        // Hidden when dropdowns are shown (avoids a duplicate month/year label).
        caption_label: cn("text-sm font-medium", usesDropdown && "hidden"),
        nav: cn("flex items-center gap-1", usesDropdown && "hidden"),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "absolute left-1 top-1 size-7 bg-transparent p-0 opacity-60 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-1 top-1 size-7 bg-transparent p-0 opacity-60 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "size-8 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 rounded-md p-0 font-normal",
          "aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground",
        ),
        today: "[&>button]:bg-accent [&>button]:text-accent-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-40",
        hidden: "invisible",
        dropdowns: "flex items-center gap-1",
        dropdown: "rounded-md border bg-background px-2 py-1 text-sm",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevClass }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", chevClass)} />
          ) : (
            <ChevronRight className={cn("size-4", chevClass)} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
