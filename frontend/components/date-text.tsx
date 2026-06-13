"use client";

import { useDateFormat } from "@/hooks/useCompany";

/** Renders a date using the company's configured date format. */
export function DateText({
  value,
  withTime = false,
}: {
  value: string | Date | null | undefined;
  withTime?: boolean;
}) {
  const { formatDate, formatDateTime } = useDateFormat();
  return <>{withTime ? formatDateTime(value) : formatDate(value)}</>;
}
