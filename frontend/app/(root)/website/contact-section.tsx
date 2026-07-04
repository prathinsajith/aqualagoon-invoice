"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSiteContent, useSiteContentMutations } from "@/hooks/queries/use-site-content";
import { getApiErrorMessage } from "@/lib/api-error";
import type { ContactContent } from "@/types/site-content";
import { SectionCard, SectionLoading } from "./section-card";

export function ContactSection() {
    const { data, isLoading } = useSiteContent();
    const { update } = useSiteContentMutations();
    const [form, setForm] = useState<ContactContent | null>(null);

    useEffect(() => {
        if (data) setForm(data.contact);
    }, [data]);

    if (isLoading || !form) return <SectionLoading />;

    const set = <K extends keyof ContactContent>(k: K, v: ContactContent[K]) =>
        setForm((f) => (f ? { ...f, [k]: v } : f));
    const setSocial = (k: keyof ContactContent["social"], v: string) =>
        setForm((f) => (f ? { ...f, social: { ...f.social, [k]: v } } : f));

    const save = async () => {
        try {
            await update.mutateAsync({ key: "contact", data: form });
            toast.success("Contact details saved");
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <SectionCard
            title="Contact & Hours"
            description="Address, phone, email, opening hours and social links — shown on the Contact page and in the footer."
            onSave={save}
            saving={update.isPending}
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="c-address">Address</Label>
                    <Input id="c-address" value={form.address} onChange={(e) => set("address", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="c-phone">Phone / WhatsApp</Label>
                    <Input id="c-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="c-email">Email</Label>
                    <Input id="c-email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="c-hw">Hours (weekdays)</Label>
                    <Input id="c-hw" value={form.hoursWeekday} onChange={(e) => set("hoursWeekday", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="c-hs">Hours (Sunday)</Label>
                    <Input id="c-hs" value={form.hoursSunday} onChange={(e) => set("hoursSunday", e.target.value)} />
                </div>
            </div>

            <div className="space-y-3">
                <Label>Social links</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="s-fb" className="text-xs font-normal text-muted-foreground">Facebook</Label>
                        <Input id="s-fb" value={form.social.facebook} onChange={(e) => setSocial("facebook", e.target.value)} placeholder="https://facebook.com/…" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="s-ig" className="text-xs font-normal text-muted-foreground">Instagram</Label>
                        <Input id="s-ig" value={form.social.instagram} onChange={(e) => setSocial("instagram", e.target.value)} placeholder="https://instagram.com/…" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="s-x" className="text-xs font-normal text-muted-foreground">X (Twitter)</Label>
                        <Input id="s-x" value={form.social.x} onChange={(e) => setSocial("x", e.target.value)} placeholder="https://x.com/…" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="s-yt" className="text-xs font-normal text-muted-foreground">YouTube</Label>
                        <Input id="s-yt" value={form.social.youtube} onChange={(e) => setSocial("youtube", e.target.value)} placeholder="https://youtube.com/…" />
                    </div>
                </div>
            </div>
        </SectionCard>
    );
}
