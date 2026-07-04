"use client";

import { useMemo, useState } from "react";
import { IconSearch, IconMail, IconPhone, IconClock } from "@tabler/icons-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/rbac/page-header";
import { Can } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RefreshButton } from "@/components/refresh-button";
import { useEnquiries, useEnquiryMutations } from "@/hooks/queries/use-enquiries";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Enquiry, EnquiryStatus } from "@/types/enquiry";

const STATUS_BADGE: Record<EnquiryStatus, string> = {
    NEW: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    CONTACTED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    CLOSED: "bg-muted text-muted-foreground",
};

function fmt(d: string) {
    try {
        return new Date(d).toLocaleString(undefined, {
            day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
        });
    } catch {
        return d;
    }
}

export function EnquiriesSection() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [status, setStatus] = useState("all");
    const [source, setSource] = useState("all");
    const search = useDebounce(searchInput, 400);

    const params = useMemo(
        () => ({
            page,
            limit: 20,
            search: search || undefined,
            status: status === "all" ? undefined : (status as EnquiryStatus),
            source: source === "all" ? undefined : (source as "contact" | "booking"),
        }),
        [page, search, status, source],
    );

    const { data, isLoading, isError, error } = useEnquiries(params);
    const { updateStatus } = useEnquiryMutations();

    const setStatusFor = async (e: Enquiry, next: EnquiryStatus) => {
        try {
            await updateStatus.mutateAsync({ id: e.id, status: next });
            toast.success(`Marked ${next.toLowerCase()}`);
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const items = data?.data ?? [];
    const totalPages = data?.meta.pagination.totalPages ?? 0;
    const totalItems = data?.meta.pagination.totalItems ?? 0;

    return (
        <div className="space-y-5">
            <PageHeader title="Bookings & enquiries" description="Leads captured from the website's Book Now and contact forms." />

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:max-w-xs">
                    <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input
                        value={searchInput}
                        onChange={(e) => {
                            setSearchInput(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search name, phone, email…"
                        className="pl-9"
                    />
                </div>
                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                    <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={source} onValueChange={(v) => { setSource(v); setPage(1); }}>
                    <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Source" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All sources</SelectItem>
                        <SelectItem value="booking">Book Now</SelectItem>
                        <SelectItem value="contact">Contact form</SelectItem>
                    </SelectContent>
                </Select>
                <RefreshButton queryKey={["enquiries"]} className="sm:ml-auto" />
            </div>

            {isError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
                    {getApiErrorMessage(error, "Failed to load enquiries")}
                </div>
            ) : isLoading && !data ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
                    No enquiries yet. Submissions from the website will appear here.
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((e) => (
                        <div key={e.id} className="rounded-xl border bg-card p-4 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{e.name}</span>
                                        <Badge className={STATUS_BADGE[e.status]}>{e.status}</Badge>
                                        <Badge variant="outline" className="capitalize">{e.source === "booking" ? "Book Now" : "Contact"}</Badge>
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                        <a href={`tel:${e.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                                            <IconPhone className="size-3.5" /> {e.phone}
                                        </a>
                                        {e.email && (
                                            <a href={`mailto:${e.email}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                                                <IconMail className="size-3.5" /> {e.email}
                                            </a>
                                        )}
                                        <span className="inline-flex items-center gap-1.5">
                                            <IconClock className="size-3.5" /> {fmt(e.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                <Can permission="enquiry.manage">
                                    <div className="flex flex-wrap gap-2">
                                        {e.status !== "CONTACTED" && (
                                            <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={() => setStatusFor(e, "CONTACTED")}>
                                                Mark contacted
                                            </Button>
                                        )}
                                        {e.status !== "CLOSED" && (
                                            <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={() => setStatusFor(e, "CLOSED")}>
                                                Close
                                            </Button>
                                        )}
                                        {e.status !== "NEW" && (
                                            <Button size="sm" variant="ghost" disabled={updateStatus.isPending} onClick={() => setStatusFor(e, "NEW")}>
                                                Reopen
                                            </Button>
                                        )}
                                    </div>
                                </Can>
                            </div>

                            {e.service && (
                                <p className="mt-3 text-sm">
                                    <span className="text-muted-foreground">Interested in:</span> <span className="font-medium">{e.service}</span>
                                </p>
                            )}
                            {e.message && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{e.message}</p>}
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{totalItems} total</span>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                        <span className="text-muted-foreground">Page {page} of {totalPages}</span>
                        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                            {isLoading ? <Spinner className="size-4" /> : "Next"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
