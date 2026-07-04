"use client";

import { useEffect, useState } from "react";
import { IconWorldWww } from "@tabler/icons-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSiteContent, useSiteContentMutations } from "@/hooks/queries/use-site-content";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { BrandingContent } from "@/types/site-content";
import { SectionCard, SectionLoading } from "./section-card";
import { SiteImagePicker } from "./site-image-picker";

/** Colour a character counter by how close it is to the ideal SEO length. */
function counterClass(len: number, min: number, max: number) {
    if (len === 0) return "text-muted-foreground";
    if (len > max) return "text-amber-600 dark:text-amber-400";
    if (len >= min) return "text-emerald-600 dark:text-emerald-400";
    return "text-muted-foreground";
}

export function BrandingSection() {
    const { data, isLoading } = useSiteContent();
    const { update } = useSiteContentMutations();
    const [form, setForm] = useState<BrandingContent | null>(null);

    useEffect(() => {
        if (data) setForm(data.branding);
    }, [data]);

    if (isLoading || !form) return <SectionLoading />;

    const set = <K extends keyof BrandingContent>(k: K, v: BrandingContent[K]) =>
        setForm((f) => (f ? { ...f, [k]: v } : f));

    const save = async () => {
        try {
            await update.mutateAsync({ key: "branding", data: form });
            toast.success("Branding & SEO saved");
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <SectionCard
            title="SEO & Branding"
            description="How your site looks in Google and when shared — plus your logo. Good titles and descriptions help people find you."
            onSave={save}
            saving={update.isPending}
        >
            {/* Google-style search preview */}
            <div className="rounded-xl border bg-muted/30 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Google preview</p>
                <div className="max-w-xl rounded-lg bg-background p-3 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <IconWorldWww className="size-3.5" /> aqualagoon.com
                    </div>
                    <div className="mt-0.5 truncate text-lg text-[#1a0dab] dark:text-[#8ab4f8]">
                        {form.metaTitle || "Your page title"}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {form.metaDescription || "Your meta description appears here — write a clear, inviting summary of your site."}
                    </p>
                </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Logo</Label>
                    <SiteImagePicker label="Logo" aspect="square" value={form.logoUrl} onChange={(url) => set("logoUrl", url)} />
                </div>
                <div className="space-y-1.5">
                    <Label>Social share image (Open Graph)</Label>
                    <SiteImagePicker label="Share image" value={form.ogImageUrl} onChange={(url) => set("ogImageUrl", url)} />
                    <p className="text-xs text-muted-foreground">Shown when your site is shared on WhatsApp, Facebook, etc. 1200 × 630px works best.</p>
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label htmlFor="b-title">Page title</Label>
                    <span className={cn("text-xs font-medium", counterClass(form.metaTitle.length, 30, 60))}>
                        {form.metaTitle.length}/60
                    </span>
                </div>
                <Input id="b-title" value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} maxLength={160} />
                <p className="text-xs text-muted-foreground">Appears as the clickable headline in Google &amp; the browser tab. Aim for 50–60 characters.</p>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label htmlFor="b-desc">Meta description</Label>
                    <span className={cn("text-xs font-medium", counterClass(form.metaDescription.length, 120, 160))}>
                        {form.metaDescription.length}/160
                    </span>
                </div>
                <Textarea id="b-desc" rows={3} value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} maxLength={320} />
                <p className="text-xs text-muted-foreground">The grey summary under the title in search results. Aim for 120–160 characters and include what you offer &amp; where.</p>
            </div>
        </SectionCard>
    );
}
