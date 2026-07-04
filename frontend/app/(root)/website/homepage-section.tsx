"use client";

import { useEffect, useState } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSiteContent, useSiteContentMutations } from "@/hooks/queries/use-site-content";
import { getApiErrorMessage } from "@/lib/api-error";
import type { HomepageContent } from "@/types/site-content";
import { SectionCard, SectionLoading } from "./section-card";
import { SiteImagePicker } from "./site-image-picker";

export function HomepageSection() {
    const { data, isLoading } = useSiteContent();
    const { update } = useSiteContentMutations();
    const [form, setForm] = useState<HomepageContent | null>(null);

    useEffect(() => {
        if (data) setForm(data.homepage);
    }, [data]);

    if (isLoading || !form) return <SectionLoading />;

    const set = <K extends keyof HomepageContent>(k: K, v: HomepageContent[K]) =>
        setForm((f) => (f ? { ...f, [k]: v } : f));

    const setStat = (i: number, field: "value" | "label", v: string) =>
        setForm((f) =>
            f ? { ...f, stats: f.stats.map((s, idx) => (idx === i ? { ...s, [field]: v } : s)) } : f,
        );

    const save = async () => {
        try {
            await update.mutateAsync({ key: "homepage", data: form });
            toast.success("Homepage saved");
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <SectionCard
            title="Homepage / Hero"
            description="The banner at the top of the website — headline, intro text, hero image and stat highlights."
            onSave={save}
            saving={update.isPending}
        >
            <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="hero-kicker">Hero headline</Label>
                        <Input
                            id="hero-kicker"
                            value={form.heroKicker}
                            onChange={(e) => set("heroKicker", e.target.value)}
                            placeholder="Your swim journey starts here."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="hero-lead">Intro paragraph</Label>
                        <Textarea
                            id="hero-lead"
                            rows={4}
                            value={form.heroLead}
                            onChange={(e) => set("heroLead", e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Hero image</Label>
                        <SiteImagePicker
                            label="Hero image"
                            value={form.heroImageUrl}
                            onChange={(url) => set("heroImageUrl", url)}
                        />
                        <p className="text-xs text-muted-foreground">Recommended 2560 × 1280px (2:1), under 500 KB.</p>
                    </div>
                    <div className="space-y-1.5">
                        <Label>&quot;Safe splash&quot; section image</Label>
                        <SiteImagePicker
                            label="Section image"
                            aspect="square"
                            value={form.whyUsImageUrl}
                            onChange={(url) => set("whyUsImageUrl", url)}
                        />
                        <p className="text-xs text-muted-foreground">Empty = the striped placeholder is shown.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Stat highlights</Label>
                    {form.stats.length < 4 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => set("stats", [...form.stats, { value: "", label: "" }])}
                        >
                            <IconPlus className="size-4" /> Add stat
                        </Button>
                    )}
                </div>
                <div className="space-y-2">
                    {form.stats.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Input
                                className="w-28"
                                value={s.value}
                                onChange={(e) => setStat(i, "value", e.target.value)}
                                placeholder="500+"
                            />
                            <Input
                                value={s.label}
                                onChange={(e) => setStat(i, "label", e.target.value)}
                                placeholder="HAPPY MEMBERS"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-9 shrink-0 text-destructive hover:text-destructive"
                                onClick={() => set("stats", form.stats.filter((_, idx) => idx !== i))}
                                aria-label="Remove stat"
                            >
                                <IconTrash className="size-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </SectionCard>
    );
}
