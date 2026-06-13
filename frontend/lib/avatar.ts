/**
 * Deterministic avatar fallback color. The same seed (e.g. a user id) always
 * maps to the same pleasant bg/text pair, so every user gets a distinct, stable
 * color when they haven't uploaded a photo.
 */
const PALETTE = [
    "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200",
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
    "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-200",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
    "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200",
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200",
    "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200",
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200",
    "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200",
    "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900 dark:text-fuchsia-200",
    "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
    "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200",
];

export function avatarColor(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return PALETTE[hash % PALETTE.length]!;
}

/** Two-letter initials from a first/last name. */
export function initialsOf(firstName?: string, lastName?: string): string {
    return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase();
}
