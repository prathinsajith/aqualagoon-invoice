"use client";

import { useMemo, useReducer } from "react";
import { IconCheck, IconCalendarOff } from "@tabler/icons-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/rbac/page-header";
import { PermissionPage } from "@/components/rbac/permission-page";
import { Button } from "@/components/ui/button";
import { DatePicker, DATE_PICKER_PAST_START } from "@/components/ui/date-picker";
import { MonthPicker } from "@/components/ui/month-picker";
import { Label } from "@/components/ui/label";
import { TableSkeleton } from "@/components/skeletons";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useAttendance,
  useAttendanceSummary,
  useAttendanceMutations,
  useBatches,
  useEnrollments,
} from "@/hooks/queries/use-training";
import { usePermissions } from "@/hooks/usePermissions";
import { useCompany } from "@/hooks/useCompany";
import { useHolidays } from "@/hooks/queries/use-holidays";
import { PersonAvatar } from "@/components/person-avatar";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { Attendance, AttendanceStatus } from "@/types/training";

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const thisMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

const STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "LEAVE"];
const STATUS_META: Record<
  AttendanceStatus,
  { label: string; letter: string; cell: string; dot: string }
> = {
  PRESENT: { label: "Present", letter: "P", cell: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300", dot: "text-green-600 dark:text-green-400" },
  ABSENT: { label: "Absent", letter: "A", cell: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300", dot: "text-red-600 dark:text-red-400" },
  LATE: { label: "Late", letter: "L", cell: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300", dot: "text-amber-600 dark:text-amber-400" },
  LEAVE: { label: "Leave", letter: "V", cell: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300", dot: "text-blue-600 dark:text-blue-400" },
};

interface Student {
  id: string;
  name: string;
  photoUrl: string | null;
  /** Days left on the student's fee plan (null = no plan / open-ended). */
  daysRemaining: number | null;
}

/** True if the calendar date (YYYY-MM-DD) is a company holiday. */
function makeHolidayCheck(weeklyOffDays: number[], holidayDates: string[]) {
  return (iso: string) =>
    holidayDates.includes(iso) ||
    weeklyOffDays.includes(new Date(`${iso}T00:00:00Z`).getUTCDay());
}

/** Day number (1-31) of a stored @db.Date attendance value (midnight UTC). */
const dayOf = (iso: string) => new Date(iso).getUTCDate();

interface AttendanceControls {
  batchId: string;
  view: "day" | "month";
  date: string;
  month: string;
  studentFilter: string;
}

export function AttendanceContent() {
  const { can } = usePermissions();
  const canMark = can("attendance.create");
  const { data: company } = useCompany();
  const { data: holidaysData } = useHolidays();
  const holidayDates = useMemo(
    () => (holidaysData ?? []).map((h) => h.date),
    [holidaysData],
  );
  const isHoliday = useMemo(
    () => makeHolidayCheck(company?.weeklyOffDays ?? [], holidayDates),
    [company?.weeklyOffDays, holidayDates],
  );

  // Grouped in a reducer so one logical update is a single render.
  const [controls, patchControls] = useReducer(
    (s: AttendanceControls, p: Partial<AttendanceControls>) => ({ ...s, ...p }),
    { batchId: "", view: "day", date: todayStr(), month: thisMonthStr(), studentFilter: "all" },
  );
  const { batchId, view, date, month, studentFilter } = controls;

  const { data: batchesData, isLoading: batchesLoading } = useBatches({ page: 1, limit: 100, status: "ACTIVE" });
  const batches = batchesData?.data ?? [];

  // Batch roster — every active enrolled student, deduped.
  const { data: rosterData, isLoading: rosterLoading } = useEnrollments({
    page: 1,
    limit: 100,
    batchId: batchId || undefined,
    status: "ACTIVE",
  });
  const roster: Student[] = useMemo(() => {
    const map = new Map<string, Student>();
    for (const e of rosterData?.data ?? []) {
      map.set(e.student.id, {
        id: e.student.id,
        name: `${e.student.firstName} ${e.student.lastName}`.trim(),
        photoUrl: e.student.photoUrl ?? null,
        daysRemaining: e.daysRemaining,
      });
    }
    return [...map.values()].toSorted((a, b) => a.name.localeCompare(b.name));
  }, [rosterData]);
  const visibleRoster = studentFilter === "all" ? roster : roster.filter((s) => s.id === studentFilter);

  // Month bounds (for the month view + per-student %).
  const [year, monthIdx] = month.split("-").map(Number);
  const daysInMonth = year && monthIdx ? new Date(year, monthIdx, 0).getDate() : 30;
  const monthFrom = `${month}-01`;
  const monthTo = `${month}-${pad(daysInMonth)}`;

  // --- Day view data ---
  const { data: daySummary, isLoading: daySummaryLoading } = useAttendanceSummary(
    { batchId, dateFrom: date, dateTo: date },
    !!batchId && view === "day",
  );
  const { data: dayData } = useAttendance({
    batchId: batchId || undefined,
    attendanceDate: date,
    limit: 100,
  });
  const dayByStudent = useMemo(() => {
    const m = new Map<string, Attendance>();
    if (view === "day") for (const a of dayData?.data ?? []) m.set(a.student.id, a);
    return m;
  }, [dayData, view]);

  // --- Month view data ---
  const { data: monthData, isLoading: monthLoading } = useAttendance({
    batchId: batchId || undefined,
    dateFrom: monthFrom,
    dateTo: monthTo,
    limit: 500,
  });
  const monthByKey = useMemo(() => {
    const m = new Map<string, AttendanceStatus>();
    if (view === "month")
      for (const a of monthData?.data ?? []) m.set(`${a.student.id}:${dayOf(a.attendanceDate)}`, a.status);
    return m;
  }, [monthData, view]);

  const { mark, update, bulkMark } = useAttendanceMutations();

  const setStatus = async (studentId: string, status: AttendanceStatus) => {
    try {
      const existing = dayByStudent.get(studentId);
      if (existing) {
        if (existing.status === status) return;
        await update.mutateAsync({ id: existing.id, payload: { status } });
      } else {
        await mark.mutateAsync({ studentId, batchId, attendanceDate: date, status });
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save attendance"));
    }
  };

  const markAllPresent = async () => {
    try {
      const res = await bulkMark.mutateAsync({
        batchId,
        attendanceDate: date,
        records: roster.map((s) => ({ studentId: s.id, status: "PRESENT" as const })),
      });
      toast.success(`Marked ${res.marked} present`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to mark attendance"));
    }
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  // Attendance isn't taken on company holidays (weekly off or a listed date).
  const dayIsHoliday = isHoliday(date);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Pick a batch, then mark the day or review the month for any student."
      />

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1.5">
          <Label>Batch</Label>
          <Select value={batchId} onValueChange={(v) => patchControls({ batchId: v })}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder={batchesLoading ? "Loading…" : "Select a batch"} />
            </SelectTrigger>
            <SelectContent>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name} — {b.program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {batchId && (
          <>
            <div className="space-y-1.5">
              <Label>Student</Label>
              <Select value={studentFilter} onValueChange={(v) => patchControls({ studentFilter: v })}>
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  {roster.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {view === "day" ? (
              <div className="space-y-1.5">
                <Label htmlFor="att-date">Date</Label>
                <DatePicker
                  id="att-date"
                  value={date}
                  onChange={(v) => v && patchControls({ date: v })}
                  placeholder="Pick a date"
                  startMonth={DATE_PICKER_PAST_START}
                  className="w-full sm:w-44"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="att-month">Month</Label>
                <MonthPicker id="att-month" value={month} onChange={(v) => patchControls({ month: v })} className="w-full sm:w-44" />
              </div>
            )}

            <Tabs value={view} onValueChange={(v) => patchControls({ view: v as "day" | "month" })} className="sm:ml-auto">
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </>
        )}
      </div>

      {!batchId ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          Select a batch to view its students and attendance.
        </div>
      ) : rosterLoading ? (
        <TableSkeleton cols={6} rows={6} />
      ) : roster.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          No active students enrolled in this batch yet.
        </div>
      ) : view === "day" ? (
        <DayView
          roster={visibleRoster}
          dayByStudent={dayByStudent}
          summary={daySummary}
          summaryLoading={daySummaryLoading}
          canMark={canMark && !dayIsHoliday}
          holiday={dayIsHoliday}
          onSet={setStatus}
          onMarkAll={markAllPresent}
          marking={bulkMark.isPending}
        />
      ) : (
        <MonthView roster={visibleRoster} days={days} byKey={monthByKey} loading={monthLoading} />
      )}
    </div>
  );
}

function DayView({
  roster,
  dayByStudent,
  summary,
  summaryLoading,
  canMark,
  holiday,
  onSet,
  onMarkAll,
  marking,
}: {
  roster: Student[];
  dayByStudent: Map<string, Attendance>;
  summary?: { present: number; absent: number; late: number; leave: number; percentage: number };
  summaryLoading: boolean;
  canMark: boolean;
  holiday: boolean;
  onSet: (studentId: string, status: AttendanceStatus) => void;
  onMarkAll: () => void;
  marking: boolean;
}) {
  const tiles: {
    label: string;
    value: number | string | undefined;
    chip: string;
    letter: string;
    valueCls: string;
  }[] = [
    { label: "Present", value: summary?.present, chip: STATUS_META.PRESENT.cell, letter: "P", valueCls: STATUS_META.PRESENT.dot },
    { label: "Absent", value: summary?.absent, chip: STATUS_META.ABSENT.cell, letter: "A", valueCls: STATUS_META.ABSENT.dot },
    { label: "Late", value: summary?.late, chip: STATUS_META.LATE.cell, letter: "L", valueCls: STATUS_META.LATE.dot },
    { label: "Leave", value: summary?.leave, chip: STATUS_META.LEAVE.cell, letter: "V", valueCls: STATUS_META.LEAVE.dot },
    {
      label: "Attendance %",
      value: summary ? `${summary.percentage}%` : undefined,
      chip: "bg-primary/10 text-primary",
      letter: "%",
      valueCls: "text-foreground",
    },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="flex items-center gap-2.5 rounded-xl bg-card px-3 py-2.5 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md dark:ring-white/10"
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold",
                t.chip,
              )}
            >
              {t.letter}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-muted-foreground">{t.label}</p>
              <p className={cn("text-lg font-bold leading-tight", t.valueCls)}>
                {summaryLoading ? "—" : (t.value ?? 0)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {holiday && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          <IconCalendarOff className="size-4 shrink-0" />
          It&apos;s a company holiday — attendance isn&apos;t taken on this day.
        </div>
      )}

      {canMark && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onMarkAll} disabled={marking}>
            <IconCheck className="size-4" /> Mark all present
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        <div className="divide-y divide-foreground/[0.06]">
          {roster.map((s) => {
            const rec = dayByStudent.get(s.id);
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40"
              >
                <PersonAvatar
                  name={s.name}
                  photoUrl={s.photoUrl}
                  seed={s.id}
                  className="size-9 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  {s.daysRemaining !== null && (
                    <p
                      className={cn(
                        "text-xs",
                        s.daysRemaining <= 0
                          ? "font-medium text-destructive"
                          : s.daysRemaining <= 5
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground",
                      )}
                    >
                      {s.daysRemaining <= 0
                        ? "Plan expired"
                        : `${s.daysRemaining} day${s.daysRemaining === 1 ? "" : "s"} left`}
                    </p>
                  )}
                </div>
                {canMark ? (
                  <Select value={rec?.status ?? ""} onValueChange={(v) => onSet(s.id, v as AttendanceStatus)}>
                    <SelectTrigger className="h-8 w-32 shrink-0">
                      <SelectValue placeholder="Not marked" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((st) => (
                        <SelectItem key={st} value={st}>
                          <span className="flex items-center gap-2">
                            <span className={cn("size-2 rounded-full bg-current", STATUS_META[st].dot)} />
                            {STATUS_META[st].label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : rec ? (
                  <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-xs font-medium", STATUS_META[rec.status].cell)}>
                    {STATUS_META[rec.status].label}
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">Not marked</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthView({
  roster,
  days,
  byKey,
  loading,
}: {
  roster: Student[];
  days: number[];
  byKey: Map<string, AttendanceStatus>;
  loading: boolean;
}) {
  if (loading) {
    return <TableSkeleton cols={6} rows={6} />;
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {STATUSES.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn("grid size-5 place-items-center rounded text-[10px] font-bold", STATUS_META[s].cell)}>
              {STATUS_META[s].letter}
            </span>
            {STATUS_META[s].label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                Student
              </th>
              {days.map((d) => (
                <th key={d} className="w-8 px-0 py-2 text-center text-[10px] font-medium text-muted-foreground">
                  {d}
                </th>
              ))}
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">%</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((s) => {
              let marked = 0;
              let attended = 0;
              const cells = days.map((d) => {
                const st = byKey.get(`${s.id}:${d}`);
                if (st) {
                  marked += 1;
                  if (st === "PRESENT" || st === "LATE") attended += 1;
                }
                return { d, st };
              });
              const pct = marked > 0 ? Math.round((attended / marked) * 100) : 0;
              return (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="sticky left-0 z-10 max-w-[12rem] truncate bg-card px-3 py-1.5 font-medium">
                    {s.name}
                  </td>
                  {cells.map(({ d, st }) => (
                    <td key={d} className="px-0.5 py-1.5 text-center">
                      {st ? (
                        <span
                          title={STATUS_META[st].label}
                          className={cn("mx-auto grid size-6 place-items-center rounded text-[10px] font-bold", STATUS_META[st].cell)}
                        >
                          {STATUS_META[st].letter}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">·</span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-right font-semibold tabular-nums">
                    {marked ? `${pct}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <PermissionPage permission="attendance.view">
      <AttendanceContent />
    </PermissionPage>
  );
}
