/** Formats a number as a 2-decimal money string (e.g. 1234.5 → "1,234.50"). */
export function formatMoney(value: number): string {
    return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
