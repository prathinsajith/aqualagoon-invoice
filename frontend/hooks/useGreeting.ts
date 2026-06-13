import { useSyncExternalStore } from "react";

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 18) return "Good Afternoon";
    return "Good Evening";
}

// Never changes after mount, so there is nothing to subscribe to.
const subscribe = () => () => {};

/**
 * Time-of-day greeting. The server renders an empty string and the client
 * renders the clock-based greeting, which avoids a hydration mismatch without
 * calling setState inside an effect.
 */
export function useGreeting(): string {
    return useSyncExternalStore(subscribe, getGreeting, () => "");
}
