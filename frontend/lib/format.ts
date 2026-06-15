/**
 * App-wide money formatting. The active currency is set once from the company
 * profile (see `useCompany`), so every `formatMoney` call across the app renders
 * the correct currency symbol without each call site needing to know it.
 */
let activeCurrency = "INR";

/** Cache one `Intl.NumberFormat` per currency — constructing it is expensive. */
const formatterCache = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string): Intl.NumberFormat | null {
    const cached = formatterCache.get(currency);
    if (cached) return cached;
    try {
        const fmt = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        formatterCache.set(currency, fmt);
        return fmt;
    } catch {
        return null;
    }
}

/** Updates the currency used by {@link formatMoney} (called when company loads). */
export function setActiveCurrency(code: string | undefined | null): void {
    if (code) activeCurrency = code;
}

/** Formats a number as money in the active currency (e.g. 1234.5 → "₹1,234.50"). */
export function formatMoney(value: number): string {
    const fmt = formatterFor(activeCurrency);
    if (fmt) return fmt.format(value);
    // Unknown currency code — fall back to a plain 2-decimal number.
    return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * Formats a number with grouping + 2 decimals but **no currency symbol** (e.g.
 * 1234.5 → "1,234.50"). Forced to en-US grouping so separators stay ASCII
 * regardless of the device locale.
 */
export function formatAmount(value: number): string {
    return value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
