"use client";

import { useRef, useCallback, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import { EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Card } from "@/components/ui/card";
import { fetchEventsService } from "./calendar.service";
import { Spinner } from "@/components/ui/spinner";

/**
 * Full Calendar Client Component
 * Displays a calendar with events fetched from the API
 * Uses caching to improve performance and reduce API calls
 */
export default function CalendarView() {
  // Cache for storing fetched events by date range
  const cache = useRef<Record<string, EventInput[]>>({});
  
  // Loading state - using useState to trigger re-renders when loading status changes
  const [isLoading, setIsLoading] = useState(false);

  const handleEvents = useCallback(
    async (
      info: { startStr: string; endStr: string },
      successCallback: (events: EventInput[]) => void,
      failureCallback: (error: Error) => void
    ) => {
      const key = `${info.startStr}_${info.endStr}`;

      // Return cached events if available
      if (cache.current[key]) {
        successCallback(cache.current[key]);
        return;
      }

      setIsLoading(true);

      try {
        const events = await fetchEventsService(info.startStr, info.endStr);
        cache.current[key] = events;
        successCallback(events);
      } catch (err) {
        console.error("Failed to fetch calendar events:", err);
        const error = err instanceof Error ? err : new Error("Failed to fetch events");
        failureCallback(error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <Card className="p-4 relative border-none shadow-sm">
      {isLoading && (
        <div className="absolute top-2 right-4 text-xs text-muted-foreground flex items-center gap-2">
          Loading <Spinner />
        </div>
      )}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="auto"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        editable
        selectable
        dayMaxEvents
        events={handleEvents}
      />
    </Card>
  );
}
