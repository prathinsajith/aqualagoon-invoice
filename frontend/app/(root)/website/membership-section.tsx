"use client";

import { useEffect, useState } from "react";
import { IconPlus, IconTrash, IconArrowUp, IconArrowDown } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useSiteContent, useSiteContentMutations } from "@/hooks/queries/use-site-content";
import { getApiErrorMessage } from "@/lib/api-error";
import type { PricingContent, PricingPlan } from "@/types/site-content";
import { SectionCard, SectionLoading } from "./section-card";

let tmpId = 0;

export function MembershipSection() {
    const { data, isLoading } = useSiteContent();
    const { update } = useSiteContentMutations();
    const [pricing, setPricing] = useState<PricingContent | null>(null);

    useEffect(() => {
        if (data) setPricing(data.pricing);
    }, [data]);

    if (isLoading || !pricing) return <SectionLoading />;

    const patch = (i: number, changes: Partial<PricingPlan>) =>
        setPricing((p) => (p ? { ...p, plans: p.plans.map((pl, idx) => (idx === i ? { ...pl, ...changes } : pl)) } : p));

    const move = (i: number, dir: -1 | 1) =>
        setPricing((p) => {
            if (!p) return p;
            const j = i + dir;
            if (j < 0 || j >= p.plans.length) return p;
            const plans = [...p.plans];
            [plans[i], plans[j]] = [plans[j], plans[i]];
            return { ...p, plans };
        });

    const remove = (i: number) =>
        setPricing((p) => (p ? { ...p, plans: p.plans.filter((_, idx) => idx !== i) } : p));

    const add = () =>
        setPricing((p) =>
            p
                ? {
                      ...p,
                      plans: [
                          ...p.plans,
                          { id: `plan-${++tmpId}-${p.plans.length}`, name: "New plan", price: "₹0", unit: "/ month", popular: false, features: [], btn: "Choose" },
                      ],
                  }
                : p,
        );

    const save = async () => {
        if (!pricing) return;
        try {
            await update.mutateAsync({ key: "pricing", data: pricing });
            toast.success("Membership & passes saved");
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <SectionCard
            title="Membership & Passes"
            description="The pricing plans shown on the Classes & Pricing page. Reorder, edit, add or remove plans."
            onSave={save}
            saving={update.isPending}
        >
            <div className="space-y-4">
                {pricing.plans.map((pl, i) => (
                    <div key={pl.id} className="space-y-3 rounded-lg border bg-background/60 p-4">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan {i + 1}</span>
                            <div className="flex items-center gap-1">
                                <Button type="button" variant="ghost" size="icon" className="size-8" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><IconArrowUp className="size-4" /></Button>
                                <Button type="button" variant="ghost" size="icon" className="size-8" disabled={i === pricing.plans.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><IconArrowDown className="size-4" /></Button>
                                <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => remove(i)} aria-label="Remove"><IconTrash className="size-4" /></Button>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-4">
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className="text-xs">Plan name</Label>
                                <Input value={pl.name} onChange={(e) => patch(i, { name: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Price</Label>
                                <Input value={pl.price} onChange={(e) => patch(i, { price: e.target.value })} placeholder="₹2,500" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Unit</Label>
                                <Input value={pl.unit} onChange={(e) => patch(i, { unit: e.target.value })} placeholder="/ month" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Features (one per line)</Label>
                            <Textarea
                                rows={3}
                                value={pl.features.join("\n")}
                                onChange={(e) => patch(i, { features: e.target.value.split("\n").map((f) => f.trim()).filter(Boolean).slice(0, 10) })}
                                placeholder={"Full pool access\nLocker & shower"}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Button label</Label>
                                <Input className="w-44" value={pl.btn} onChange={(e) => patch(i, { btn: e.target.value })} />
                            </div>
                            <label className="flex items-center gap-2 pt-5 text-sm text-muted-foreground">
                                <Switch checked={pl.popular} onCheckedChange={(v) => patch(i, { popular: v })} />
                                Highlight as “Most popular”
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            {pricing.plans.length < 8 && (
                <Button type="button" variant="outline" onClick={add}>
                    <IconPlus className="size-4" /> Add plan
                </Button>
            )}

            <div className="space-y-1.5">
                <Label htmlFor="pricing-note">Footnote</Label>
                <Input id="pricing-note" value={pricing.note} onChange={(e) => setPricing((p) => (p ? { ...p, note: e.target.value } : p))} />
            </div>
        </SectionCard>
    );
}
