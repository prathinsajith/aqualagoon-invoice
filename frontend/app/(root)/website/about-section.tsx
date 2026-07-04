"use client";

import { useEffect, useState } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSiteContent, useSiteContentMutations } from "@/hooks/queries/use-site-content";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AboutContent, SafetyCard } from "@/types/site-content";
import { SectionCard, SectionLoading } from "./section-card";
import { SiteImagePicker } from "./site-image-picker";

const THEMES: { icon: string; color: string; tint: string; label: string }[] = [
    { icon: "buoy", color: "#1479cf", tint: "#e0f4fd", label: "Buoy (blue)" },
    { icon: "beaker", color: "#0e9e8a", tint: "#e0f7f4", label: "Beaker (teal)" },
    { icon: "smile", color: "#d08512", tint: "#fff4e2", label: "Smile (amber)" },
    { icon: "sparkles", color: "#2b6fd4", tint: "#e6f0fe", label: "Sparkles (indigo)" },
    { icon: "users", color: "#5b52c9", tint: "#eef0ff", label: "Users (violet)" },
    { icon: "droplets", color: "#0e9e8a", tint: "#e0f7f4", label: "Droplets (teal)" },
];

export function AboutSection() {
    const { data, isLoading } = useSiteContent();
    const { update } = useSiteContentMutations();
    const [form, setForm] = useState<AboutContent | null>(null);

    useEffect(() => {
        if (data) setForm(data.about);
    }, [data]);

    if (isLoading || !form) return <SectionLoading />;

    const set = <K extends keyof AboutContent>(k: K, v: AboutContent[K]) =>
        setForm((f) => (f ? { ...f, [k]: v } : f));
    const setStat = (i: number, field: "value" | "label", v: string) =>
        set("stats", form.stats.map((s, idx) => (idx === i ? { ...s, [field]: v } : s)));
    const patchSafety = (i: number, changes: Partial<SafetyCard>) =>
        set("safety", form.safety.map((s, idx) => (idx === i ? { ...s, ...changes } : s)));
    const patchHighlight = (i: number, changes: Partial<SafetyCard>) =>
        set("highlights", form.highlights.map((s, idx) => (idx === i ? { ...s, ...changes } : s)));
    const setClassInfo = (i: number, field: "label" | "value", v: string) =>
        set("classInfo", form.classInfo.map((c, idx) => (idx === i ? { ...c, [field]: v } : c)));

    const save = async () => {
        try {
            await update.mutateAsync({ key: "about", data: form });
            toast.success("About page saved");
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <SectionCard
            title="About page"
            description="The story, numbers and safety highlights shown on the public About page."
            onSave={save}
            saving={update.isPending}
        >
            <div className="space-y-1.5">
                <Label htmlFor="a-title">Page title</Label>
                <Input id="a-title" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="a-intro">Intro paragraph</Label>
                <Textarea id="a-intro" rows={2} value={form.intro} onChange={(e) => set("intro", e.target.value)} />
            </div>

            <div className="space-y-1.5">
                <Label>Facility photo</Label>
                <SiteImagePicker label="Facility photo" value={form.imageUrl} onChange={(url) => set("imageUrl", url)} />
                <p className="text-xs text-muted-foreground">Empty = the striped placeholder is shown.</p>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="a-story-title">Story heading</Label>
                <Input id="a-story-title" value={form.storyTitle} onChange={(e) => set("storyTitle", e.target.value)} />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Story paragraphs</Label>
                    {form.storyParagraphs.length < 6 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => set("storyParagraphs", [...form.storyParagraphs, ""])}>
                            <IconPlus className="size-4" /> Add paragraph
                        </Button>
                    )}
                </div>
                {form.storyParagraphs.map((p, i) => (
                    <div key={i} className="flex gap-2">
                        <Textarea rows={2} value={p} onChange={(e) => set("storyParagraphs", form.storyParagraphs.map((x, idx) => (idx === i ? e.target.value : x)))} />
                        <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0 text-destructive hover:text-destructive" onClick={() => set("storyParagraphs", form.storyParagraphs.filter((_, idx) => idx !== i))} aria-label="Remove paragraph">
                            <IconTrash className="size-4" />
                        </Button>
                    </div>
                ))}
            </div>

            {/* By the numbers */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>By the numbers</Label>
                    {form.stats.length < 6 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => set("stats", [...form.stats, { value: "", label: "" }])}>
                            <IconPlus className="size-4" /> Add stat
                        </Button>
                    )}
                </div>
                {form.stats.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <Input className="w-28" value={s.value} onChange={(e) => setStat(i, "value", e.target.value)} placeholder="500+" />
                        <Input value={s.label} onChange={(e) => setStat(i, "label", e.target.value)} placeholder="Active members" />
                        <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0 text-destructive hover:text-destructive" onClick={() => set("stats", form.stats.filter((_, idx) => idx !== i))} aria-label="Remove stat">
                            <IconTrash className="size-4" />
                        </Button>
                    </div>
                ))}
            </div>

            {/* Safety cards */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Safety highlights</Label>
                    {form.safety.length < 6 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => set("safety", [...form.safety, { icon: "buoy", color: "#1479cf", tint: "#e0f4fd", title: "", text: "" }])}>
                            <IconPlus className="size-4" /> Add card
                        </Button>
                    )}
                </div>
                {form.safety.map((s, i) => (
                    <div key={i} className="space-y-2 rounded-lg border bg-background/60 p-3">
                        <div className="flex gap-2">
                            <Input value={s.title} onChange={(e) => patchSafety(i, { title: e.target.value })} placeholder="Certified lifeguards" />
                            <Select value={s.icon} onValueChange={(v) => { const t = THEMES.find((t) => t.icon === v); if (t) patchSafety(i, t); }}>
                                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {THEMES.map((t) => <SelectItem key={t.icon} value={t.icon}>{t.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0 text-destructive hover:text-destructive" onClick={() => set("safety", form.safety.filter((_, idx) => idx !== i))} aria-label="Remove card">
                                <IconTrash className="size-4" />
                            </Button>
                        </div>
                        <Textarea rows={2} value={s.text} onChange={(e) => patchSafety(i, { text: e.target.value })} placeholder="Short description…" />
                    </div>
                ))}
            </div>

            {/* The pool & swimming — feature highlights */}
            <div className="space-y-2">
                <Label htmlFor="a-highlights-title">&quot;Pool &amp; swimming&quot; section heading</Label>
                <Input id="a-highlights-title" value={form.highlightsTitle} onChange={(e) => set("highlightsTitle", e.target.value)} />
                <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-medium">Highlight cards</span>
                    {form.highlights.length < 8 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => set("highlights", [...form.highlights, { icon: "droplets", color: "#1479cf", tint: "#e0f4fd", title: "", text: "" }])}>
                            <IconPlus className="size-4" /> Add card
                        </Button>
                    )}
                </div>
                {form.highlights.map((s, i) => (
                    <div key={i} className="space-y-2 rounded-lg border bg-background/60 p-3">
                        <div className="flex gap-2">
                            <Input value={s.title} onChange={(e) => patchHighlight(i, { title: e.target.value })} placeholder="Temperature-controlled water" />
                            <Select value={s.icon} onValueChange={(v) => { const t = THEMES.find((t) => t.icon === v); if (t) patchHighlight(i, t); }}>
                                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {THEMES.map((t) => <SelectItem key={t.icon} value={t.icon}>{t.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0 text-destructive hover:text-destructive" onClick={() => set("highlights", form.highlights.filter((_, idx) => idx !== i))} aria-label="Remove card">
                                <IconTrash className="size-4" />
                            </Button>
                        </div>
                        <Textarea rows={2} value={s.text} onChange={(e) => patchHighlight(i, { text: e.target.value })} placeholder="Short description…" />
                    </div>
                ))}
            </div>

            {/* Class details — label/value facts */}
            <div className="space-y-2">
                <Label htmlFor="a-classinfo-title">&quot;Class details&quot; section heading</Label>
                <Input id="a-classinfo-title" value={form.classInfoTitle} onChange={(e) => set("classInfoTitle", e.target.value)} />
                <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-medium">Detail facts</span>
                    {form.classInfo.length < 10 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => set("classInfo", [...form.classInfo, { label: "", value: "" }])}>
                            <IconPlus className="size-4" /> Add fact
                        </Button>
                    )}
                </div>
                {form.classInfo.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <Input className="w-40" value={c.label} onChange={(e) => setClassInfo(i, "label", e.target.value)} placeholder="Ages" />
                        <Input value={c.value} onChange={(e) => setClassInfo(i, "value", e.target.value)} placeholder="4 years & up" />
                        <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0 text-destructive hover:text-destructive" onClick={() => set("classInfo", form.classInfo.filter((_, idx) => idx !== i))} aria-label="Remove fact">
                            <IconTrash className="size-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
}
