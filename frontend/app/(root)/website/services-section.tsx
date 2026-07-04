"use client";

import { useEffect, useState } from "react";
import { IconPlus, IconTrash, IconArrowUp, IconArrowDown } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSiteContent, useSiteContentMutations } from "@/hooks/queries/use-site-content";
import { getApiErrorMessage } from "@/lib/api-error";
import type { ServiceItem, ServicesContent } from "@/types/site-content";
import { SectionCard, SectionLoading } from "./section-card";
import { SiteImagePicker } from "./site-image-picker";

/** Icon + colour presets — the `icon` name must exist in the website's icon set. */
const THEMES: { icon: string; color: string; tint: string; label: string }[] = [
    { icon: "waves", color: "#1479cf", tint: "#e0f4fd", label: "Waves (blue)" },
    { icon: "gradcap", color: "#2b6fd4", tint: "#e6f0fe", label: "Graduation (indigo)" },
    { icon: "droplets", color: "#0e9e8a", tint: "#e0f7f4", label: "Droplets (teal)" },
    { icon: "yoga", color: "#5b52c9", tint: "#eef0ff", label: "Yoga (violet)" },
    { icon: "music", color: "#c94f7c", tint: "#ffeef4", label: "Music (pink)" },
    { icon: "ticket", color: "#d08512", tint: "#fff4e2", label: "Ticket (amber)" },
    { icon: "users", color: "#0e9e8a", tint: "#e0f7f4", label: "Users (teal)" },
    { icon: "buoy", color: "#1479cf", tint: "#e0f4fd", label: "Buoy (blue)" },
    { icon: "sparkles", color: "#2b6fd4", tint: "#e6f0fe", label: "Sparkles (indigo)" },
    { icon: "calendar", color: "#d08512", tint: "#fff4e2", label: "Calendar (amber)" },
];

let tmpId = 0;

export function ServicesSection() {
    const { data, isLoading } = useSiteContent();
    const { update } = useSiteContentMutations();
    const [items, setItems] = useState<ServiceItem[] | null>(null);

    useEffect(() => {
        if (data) setItems(data.services.items);
    }, [data]);

    if (isLoading || !items) return <SectionLoading />;

    const patch = (i: number, changes: Partial<ServiceItem>) =>
        setItems((list) => (list ? list.map((it, idx) => (idx === i ? { ...it, ...changes } : it)) : list));

    const move = (i: number, dir: -1 | 1) =>
        setItems((list) => {
            if (!list) return list;
            const j = i + dir;
            if (j < 0 || j >= list.length) return list;
            const copy = [...list];
            [copy[i], copy[j]] = [copy[j], copy[i]];
            return copy;
        });

    const remove = (i: number) => setItems((list) => (list ? list.filter((_, idx) => idx !== i) : list));

    const add = () =>
        setItems((list) => [
            ...(list ?? []),
            {
                id: `svc-${++tmpId}-${(list?.length ?? 0) + 1}`,
                icon: "waves",
                color: "#1479cf",
                tint: "#e0f4fd",
                title: "New service",
                blurb: "",
                long: "",
                tags: [],
                cta: "Learn more",
                imgRight: (list?.length ?? 0) % 2 === 1,
                imageUrl: "",
            },
        ]);

    const save = async () => {
        try {
            const payload: ServicesContent = { items: items! };
            await update.mutateAsync({ key: "services", data: payload });
            toast.success("Services saved");
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <SectionCard
            title="Services"
            description="The service cards shown on the homepage and Services page. Reorder, edit, add or remove."
            onSave={save}
            saving={update.isPending}
        >
            <div className="space-y-4">
                {items.map((it, i) => (
                    <div key={it.id} className="space-y-3 rounded-lg border bg-background/60 p-4">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Service {i + 1}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button type="button" variant="ghost" size="icon" className="size-8" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                                    <IconArrowUp className="size-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="size-8" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                                    <IconArrowDown className="size-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => remove(i)} aria-label="Remove">
                                    <IconTrash className="size-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Title</Label>
                                <Input value={it.title} onChange={(e) => patch(i, { title: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Icon &amp; colour</Label>
                                <Select
                                    value={it.icon}
                                    onValueChange={(v) => {
                                        const t = THEMES.find((t) => t.icon === v);
                                        if (t) patch(i, { icon: t.icon, color: t.color, tint: t.tint });
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {THEMES.map((t) => (
                                            <SelectItem key={t.icon} value={t.icon}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Short blurb (homepage card)</Label>
                            <Textarea rows={2} value={it.blurb} onChange={(e) => patch(i, { blurb: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Full description (Services page)</Label>
                            <Textarea rows={3} value={it.long} onChange={(e) => patch(i, { long: e.target.value })} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Tags (comma-separated)</Label>
                                <Input
                                    value={it.tags.join(", ")}
                                    onChange={(e) =>
                                        patch(i, {
                                            tags: e.target.value
                                                .split(",")
                                                .map((t) => t.trim())
                                                .filter(Boolean)
                                                .slice(0, 6),
                                        })
                                    }
                                    placeholder="Day pass, Lanes, Family time"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Button label</Label>
                                <Input value={it.cta} onChange={(e) => patch(i, { cta: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-[200px_1fr] sm:items-start">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Photo</Label>
                                <SiteImagePicker
                                    label="Photo"
                                    value={it.imageUrl}
                                    onChange={(url) => patch(i, { imageUrl: url })}
                                />
                                <p className="text-xs text-muted-foreground">Empty = the icon placeholder is shown.</p>
                            </div>
                            <label className="flex items-center gap-2 pt-6 text-sm text-muted-foreground">
                                <Switch checked={it.imgRight} onCheckedChange={(v) => patch(i, { imgRight: v })} />
                                Image on the right (Services page layout)
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            {items.length < 12 && (
                <Button type="button" variant="outline" onClick={add}>
                    <IconPlus className="size-4" /> Add service
                </Button>
            )}
        </SectionCard>
    );
}
