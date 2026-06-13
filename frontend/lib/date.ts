const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const DEFAULT_DATE_FORMAT = "DD/MM/YYYY";

/** Formats a date value using one of the supported company date formats. */
export function formatDate(
    value: string | Date | null | undefined,
    fmt: string = DEFAULT_DATE_FORMAT,
): string {
    if (!value) return "—";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "—";

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    const mmm = MONTHS[d.getMonth()];

    switch (fmt) {
        case "MM/DD/YYYY":
            return `${mm}/${dd}/${yyyy}`;
        case "YYYY-MM-DD":
            return `${yyyy}-${mm}-${dd}`;
        case "DD MMM YYYY":
            return `${dd} ${mmm} ${yyyy}`;
        case "DD/MM/YYYY":
        default:
            return `${dd}/${mm}/${yyyy}`;
    }
}

/** Same as formatDate plus a 24h time, e.g. "13/06/2026 16:02". */
export function formatDateTime(
    value: string | Date | null | undefined,
    fmt: string = DEFAULT_DATE_FORMAT,
): string {
    if (!value) return "—";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${formatDate(d, fmt)} ${hh}:${min}`;
}
