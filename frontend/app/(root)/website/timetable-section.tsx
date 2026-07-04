"use client";

import { useEffect, useState } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSiteContent, useSiteContentMutations } from "@/hooks/queries/use-site-content";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { TimetableContent, TimetableSlot } from "@/types/site-content";
import { SectionCard, SectionLoading } from "./section-card";

const NONE = "__none__";
/** Fixed week order — selected days always render in this order. */
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let keyCounter = 0;

export function TimetableSection() {
    const { data, isLoading } = useSiteContent();
    const { update } = useSiteContentMutations();
    const [tt, setTt] = useState<TimetableContent | null>(null);

    useEffect(() => {
        if (data) setTt(data.timetable);
    }, [data]);

    if (isLoading || !tt) return <SectionLoading />;

    // Toggle a weekday on/off. Days stay in week order, and each row's cells are
    // re-mapped by day so existing assignments follow their day (not their index).
    const toggleDay = (day: string) =>
        setTt((t) => {
            if (!t) return t;
            const selected = new Set(t.days);
            if (selected.has(day)) selected.delete(day);
            else selected.add(day);
            const newDays = WEEK.filter((d) => selected.has(d));
            const rows = t.rows.map((r) => {
                const byDay: Record<string, string> = {};
                t.days.forEach((d, i) => {
                    byDay[d] = r.cells[i] ?? "";
                });
                return { ...r, cells: newDays.map((d) => byDay[d] ?? "") };
            });
            return { ...t, days: newDays, rows };
        });

    const patchSlot = (i: number, changes: Partial<TimetableSlot>) =>
        setTt((t) => (t ? { ...t, slots: t.slots.map((s, idx) => (idx === i ? { ...s, ...changes } : s)) } : t));

    const addSlot = () =>
        setTt((t) =>
            t ? { ...t, slots: [...t.slots, { key: `k${++keyCounter}${t.slots.length}`, label: "New class", color: "#0b6aab", bg: "#e0f4fd" }] } : t,
        );

    const removeSlot = (i: number) =>
        setTt((t) => {
            if (!t) return t;
            const removed = t.slots[i].key;
            return {
                ...t,
                slots: t.slots.filter((_, idx) => idx !== i),
                rows: t.rows.map((r) => ({ ...r, cells: r.cells.map((c) => (c === removed ? "" : c)) })),
            };
        });

    const setRowTime = (i: number, time: string) =>
        setTt((t) => (t ? { ...t, rows: t.rows.map((r, idx) => (idx === i ? { ...r, time } : r)) } : t));

    const setCell = (rowIdx: number, dayIdx: number, key: string) =>
        setTt((t) => {
            if (!t) return t;
            const rows = t.rows.map((r, idx) => {
                if (idx !== rowIdx) return r;
                const cells = [...r.cells];
                while (cells.length < t.days.length) cells.push("");
                cells[dayIdx] = key;
                return { ...r, cells };
            });
            return { ...t, rows };
        });

    const addRow = () =>
        setTt((t) => (t ? { ...t, rows: [...t.rows, { time: "", cells: Array(t.days.length).fill("") }] } : t));

    const removeRow = (i: number) =>
        setTt((t) => (t ? { ...t, rows: t.rows.filter((_, idx) => idx !== i) } : t));

    const save = async () => {
        if (!tt) return;
        // Normalize each row's cells to the number of days.
        const rows = tt.rows.map((r) => {
            const cells = [...r.cells];
            cells.length = tt.days.length;
            return { time: r.time, cells: Array.from(cells, (c) => c ?? "") };
        });
        try {
            await update.mutateAsync({ key: "timetable", data: { ...tt, rows } });
            toast.success("Timetable saved");
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <SectionCard
            title="Timetable"
            description="The weekly class schedule shown on the homepage and Classes & Pricing page."
            onSave={save}
            saving={update.isPending}
        >
            {/* Days */}
            <div className="space-y-1.5">
                <Label>Open days</Label>
                <div className="flex flex-wrap gap-2">
                    {WEEK.map((d) => {
                        const on = tt.days.includes(d);
                        return (
                            <button
                                key={d}
                                type="button"
                                onClick={() => toggleDay(d)}
                                aria-pressed={on}
                                className={cn(
                                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                                    on
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                                )}
                            >
                                {d}
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs text-muted-foreground">Tap the days your timetable covers — columns update to match.</p>
            </div>

            {/* Class types (slots) */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Class types</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                        <IconPlus className="size-4" /> Add type
                    </Button>
                </div>
                <div className="space-y-2">
                    {tt.slots.map((s, i) => (
                        <div key={s.key} className="flex flex-wrap items-center gap-2 rounded-lg border bg-background/60 p-2">
                            <Input className="w-44" value={s.label} onChange={(e) => patchSlot(i, { label: e.target.value })} placeholder="Class name" />
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                Text
                                <input type="color" value={s.color} onChange={(e) => patchSlot(i, { color: e.target.value })} className="size-8 cursor-pointer rounded border" />
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                Fill
                                <input type="color" value={s.bg} onChange={(e) => patchSlot(i, { bg: e.target.value })} className="size-8 cursor-pointer rounded border" />
                            </label>
                            <span className="rounded px-2.5 py-1 text-xs font-semibold" style={{ color: s.color, background: s.bg }}>
                                {s.label || "Preview"}
                            </span>
                            <Button type="button" variant="ghost" size="icon" className="ml-auto size-8 text-destructive hover:text-destructive" onClick={() => removeSlot(i)} aria-label="Remove class type">
                                <IconTrash className="size-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Weekly grid */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Weekly grid</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addRow}>
                        <IconPlus className="size-4" /> Add time row
                    </Button>
                </div>
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-muted/50">
                                <th className="p-2 text-left font-semibold">Time</th>
                                {tt.days.map((d) => (
                                    <th key={d} className="p-2 text-left font-semibold">{d}</th>
                                ))}
                                <th className="w-10 p-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {tt.rows.map((row, ri) => (
                                <tr key={ri} className="border-t">
                                    <td className="p-1.5 align-top">
                                        <Input className="w-28" value={row.time} onChange={(e) => setRowTime(ri, e.target.value)} placeholder="6–8 AM" />
                                    </td>
                                    {tt.days.map((d, di) => (
                                        <td key={di} className="p-1.5 align-top">
                                            <Select
                                                value={row.cells[di] ? row.cells[di] : NONE}
                                                onValueChange={(v) => setCell(ri, di, v === NONE ? "" : v)}
                                            >
                                                <SelectTrigger className="min-w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={NONE}>—</SelectItem>
                                                    {tt.slots.map((s) => (
                                                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    ))}
                                    <td className="p-1.5 align-top">
                                        <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => removeRow(ri)} aria-label="Remove row">
                                            <IconTrash className="size-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </SectionCard>
    );
}
