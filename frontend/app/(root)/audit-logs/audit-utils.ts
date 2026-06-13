/** Audit-log formatting helpers (kept out of component files for Fast Refresh). */

/** "stockQuantity" -> "Stock quantity". */
export const titleCase = (s: string) =>
  s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();

/** "PRODUCT_CATEGORY_UPDATE" -> "Product category updated". */
export function humanizeAction(action: string): string {
  const VERBS: Record<string, string> = {
    CREATE: "created",
    UPDATE: "updated",
    DELETE: "deleted",
    RESTORE: "restored",
    LOGIN: "signed in",
    LOGOUT: "signed out",
    LOGOUT_ALL: "signed out everywhere",
    ASSIGNMENT: "assignment changed",
  };
  const parts = action.split("_");
  const last = parts[parts.length - 1];
  if (VERBS[action]) return VERBS[action].replace(/^./, (c) => c.toUpperCase());
  if (last && VERBS[last]) {
    const subject = parts.slice(0, -1).join(" ").toLowerCase();
    return `${subject.charAt(0).toUpperCase()}${subject.slice(1)} ${VERBS[last]}`;
  }
  return titleCase(action.toLowerCase().replace(/_/g, " "));
}
