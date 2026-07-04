"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconCalendarEvent, IconX, IconPlus, IconCheck } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { TableSkeleton } from "@/components/skeletons";
import { DatePicker, DATE_PICKER_FUTURE_END, DATE_PICKER_PAST_START } from "@/components/ui/date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useCompany, useDateFormat } from "@/hooks/useCompany";
import { useHolidays, useHolidayMutations } from "@/hooks/queries/use-holidays";
import { usePermissions } from "@/hooks/usePermissions";
import { CompanyService } from "@/services/company-service";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Full weekday name for a "YYYY-MM-DD" date (deterministic — no "now"). */
function weekdayOf(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: "long" });
}

export function HolidaysSection() {
  const qc = useQueryClient();
  const { can } = usePermissions();
  const canManage = can("setting.manage");

  const { formatDate } = useDateFormat();
  const { data: company } = useCompany();
  const weeklyOffDays = company?.weeklyOffDays ?? [];

  const { data: holidays, isLoading, isError, error } = useHolidays();
  const { create, remove } = useHolidayMutations();

  const [pickedDate, setPickedDate] = useState("");
  const [name, setName] = useState("");

  const weeklyOff = useMutation({
    mutationFn: (next: number[]) => CompanyService.update({ weeklyOffDays: next }),
    onSuccess: (data) => {
      qc.setQueryData(["company"], data);
      toast.success("Weekly off days updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const toggleWeeklyOff = (day: number) => {
    if (!canManage) return;
    const next = weeklyOffDays.includes(day)
      ? weeklyOffDays.filter((d) => d !== day)
      : [...weeklyOffDays, day].toSorted((a, b) => a - b);
    weeklyOff.mutate(next);
  };

  const addHoliday = () => {
    if (!pickedDate) return;
    create.mutate(
      { date: pickedDate, name: name.trim() || null },
      {
        onSuccess: () => {
          toast.success("Holiday added");
          setPickedDate("");
          setName("");
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  const removeHoliday = (id: string) => {
    remove.mutate(id, {
      onSuccess: () => toast.success("Holiday removed"),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const holidayList = holidays ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Holidays & weekly offs</h3>
        <p className="text-sm text-muted-foreground">
          Days the facility is closed. Attendance isn&apos;t taken on weekly offs or these dates,
          and they don&apos;t consume a student&apos;s training days.
        </p>
      </div>

      {/* Weekly off days */}
      <div className="rounded-xl bg-muted/40 p-4">
        <p className="text-sm font-medium">Weekly off days</p>
        <p className="mb-3 text-xs text-muted-foreground">Repeat every week as non-working days.</p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_LABELS.map((label, index) => {
            const active = weeklyOffDays.includes(index);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleWeeklyOff(index)}
                disabled={!canManage || weeklyOff.isPending}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  active
                    ? "bg-primary/15 text-primary"
                    : "bg-card text-muted-foreground hover:bg-card/70",
                )}
              >
                {active && <IconCheck className="size-3.5" stroke={2.5} />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Holiday dates */}
      <div className="rounded-xl bg-muted/40 p-4">
        <p className="text-sm font-medium">Holiday dates</p>
        <p className="mb-3 text-xs text-muted-foreground">
          One-off closures like public holidays or maintenance days.
        </p>

        {/* Add a holiday */}
        {canManage && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg bg-card p-3 shadow-sm sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="holiday-date" className="text-xs">Date</Label>
              <DatePicker
                id="holiday-date"
                value={pickedDate}
                onChange={setPickedDate}
                placeholder="Pick a date"
                startMonth={DATE_PICKER_PAST_START}
                endMonth={DATE_PICKER_FUTURE_END}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="holiday-name" className="text-xs">
                Name <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="holiday-name"
                placeholder="e.g. Diwali"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button type="button" onClick={addHoliday} disabled={!pickedDate || create.isPending}>
              {create.isPending ? <Spinner /> : <IconPlus className="size-4" />} Add
            </Button>
          </div>
        )}

        {/* List */}
        {isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
            {getApiErrorMessage(error, "Failed to load holidays")}
          </div>
        ) : isLoading && !holidays ? (
          <TableSkeleton cols={4} rows={4} />
        ) : holidayList.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg bg-card py-10 text-center shadow-sm">
            <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
              <IconCalendarEvent className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">No holidays added yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-0 bg-muted/60 hover:bg-muted/60">
                  <TableHead className="h-10 pl-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="h-10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Day
                  </TableHead>
                  <TableHead className="h-10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Name
                  </TableHead>
                  {canManage && <TableHead className="h-10 w-12 pr-4" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidayList.map((h) => {
                  const d = new Date(`${h.date}T00:00:00`);
                  return (
                    <TableRow key={h.id} className="border-foreground/[0.06] transition-colors hover:bg-muted/40">
                      <TableCell className="py-2.5 pl-4">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 leading-none text-primary">
                            <span className="text-sm font-bold">{d.getDate()}</span>
                            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider">
                              {d.toLocaleDateString(undefined, { month: "short" })}
                            </span>
                          </span>
                          <span className="font-medium">{formatDate(h.date)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {weekdayOf(h.date)}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 text-sm">
                        {h.name ? h.name : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      {canManage && (
                        <TableCell className="py-2.5 pr-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeHoliday(h.id)}
                            disabled={remove.isPending}
                            aria-label={`Remove holiday ${h.date}`}
                          >
                            <IconX className="size-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
