import { api } from "@/lib/axios";
import { CalendarEventsResponse } from "@/types/api";

/**
 * Fetch Calendar Events
 * Retrieves events for a given date range from the backend API
 * 
 * @param startDate - ISO date string for range start
 * @param endDate - ISO date string for range end
 * @returns Promise with array of calendar events
 */
export async function fetchEventsService(
    startDate: string,
    endDate: string
): Promise<CalendarEventsResponse> {
    // Using GET for fetching data (RESTful best practice)
    // Query parameters are used instead of request body
    const response = await api.get<CalendarEventsResponse>("/api/calendar/events", {
        params: {
            startDate,
            endDate,
        },
    });

    return response.data;
}