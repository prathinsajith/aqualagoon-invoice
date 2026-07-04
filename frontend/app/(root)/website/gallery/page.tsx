"use client";

import { useMemo, useRef, useState } from "react";
import { IconPhotoPlus, IconSearch, IconTrash, IconPencil, IconUpload } from "@tabler/icons-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/rbac/page-header";
import { PermissionPage } from "@/components/rbac/permission-page";
import { ConfirmDialog } from "@/components/rbac/confirm-dialog";
import { Can } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RefreshButton } from "@/components/refresh-button";
import { useGallery, useGalleryMutations } from "@/hooks/queries/use-gallery";
import { usePermissions } from "@/hooks/usePermissions";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage } from "@/lib/api-error";
import { resolveMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { GalleryImage } from "@/types/gallery";

/** Categories offered in the admin — these match the public website's filter bar. */
const CATEGORY_OPTIONS = ["Pool", "Kids", "Yoga", "Zumba", "Events", "General"];
const MAX_BYTES = 5 * 1024 * 1024;

export function GalleryManagerContent() {
    const { can } = usePermissions();
    const [searchInput, setSearchInput] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [visibility, setVisibility] = useState("all");
    const search = useDebounce(searchInput, 400);

    const params = useMemo(
        () => ({
            page: 1,
            limit: 60,
            search: search || undefined,
            category: categoryFilter === "all" ? undefined : categoryFilter,
            isPublished: visibility === "all" ? undefined : visibility === "published",
            sortBy: "sortOrder" as const,
            sortOrder: "asc" as const,
        }),
        [search, categoryFilter, visibility],
    );

    const { data, isLoading, isError, error } = useGallery(params);
    const { create, update, remove } = useGalleryMutations();

    const [uploadOpen, setUploadOpen] = useState(false);
    const [editing, setEditing] = useState<GalleryImage | null>(null);
    const [pendingDelete, setPendingDelete] = useState<GalleryImage | null>(null);

    const items = data?.data ?? [];

    const togglePublished = async (img: GalleryImage) => {
        try {
            await update.mutateAsync({ id: img.id, payload: { isPublished: !img.isPublished } });
            toast.success(img.isPublished ? "Hidden from website" : "Published to website");
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            await remove.mutateAsync(pendingDelete.id);
            toast.success("Image deleted");
            setPendingDelete(null);
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Website Gallery"
                description="Images shown on the public website's Gallery page. Only published images are visible to visitors."
            >
                <Can permission="gallery.create">
                    <Button onClick={() => setUploadOpen(true)}>
                        <IconPhotoPlus className="size-4" /> Add image
                    </Button>
                </Can>
            </PageHeader>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:max-w-xs">
                    <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by title…"
                        className="pl-9"
                    />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {CATEGORY_OPTIONS.map((c) => (
                            <SelectItem key={c} value={c}>
                                {c}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Visibility" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                </Select>

                <RefreshButton queryKey={["gallery"]} className="sm:ml-auto" />
            </div>

            {isError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
                    {getApiErrorMessage(error, "Failed to load gallery")}
                </div>
            ) : isLoading && !data ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-xl border border-dashed p-12 text-center">
                    <IconPhotoPlus className="mx-auto size-10 text-muted-foreground/50" />
                    <p className="mt-3 text-sm text-muted-foreground">
                        No gallery images yet. Add your first image to show it on the website.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((img) => (
                        <div
                            key={img.id}
                            className="group overflow-hidden rounded-xl border bg-card shadow-sm"
                        >
                            <div className="relative aspect-[4/3] bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={resolveMediaUrl(img.imageUrl)}
                                    alt={img.title}
                                    className={cn(
                                        "size-full object-cover transition",
                                        !img.isPublished && "opacity-50 grayscale",
                                    )}
                                />
                                <Badge
                                    variant="secondary"
                                    className="absolute left-2 top-2 bg-background/85 backdrop-blur"
                                >
                                    {img.category}
                                </Badge>
                                {!img.isPublished && (
                                    <Badge className="absolute right-2 top-2 bg-amber-500 text-white">Hidden</Badge>
                                )}
                            </div>
                            <div className="space-y-2 p-3">
                                <p className="truncate text-sm font-semibold" title={img.title}>
                                    {img.title}
                                </p>
                                <div className="flex items-center justify-between gap-2">
                                    <Can
                                        permission="gallery.update"
                                        fallback={
                                            <span className="text-xs text-muted-foreground">
                                                {img.isPublished ? "Published" : "Hidden"}
                                            </span>
                                        }
                                    >
                                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Switch
                                                checked={img.isPublished}
                                                onCheckedChange={() => togglePublished(img)}
                                                aria-label="Toggle published"
                                            />
                                            {img.isPublished ? "Published" : "Hidden"}
                                        </label>
                                    </Can>
                                    <div className="flex items-center gap-1">
                                        <Can permission="gallery.update">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                onClick={() => setEditing(img)}
                                                aria-label="Edit"
                                            >
                                                <IconPencil className="size-4" />
                                            </Button>
                                        </Can>
                                        <Can permission="gallery.delete">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-destructive hover:text-destructive"
                                                onClick={() => setPendingDelete(img)}
                                                aria-label="Delete"
                                            >
                                                <IconTrash className="size-4" />
                                            </Button>
                                        </Can>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {can("gallery.create") && (
                <UploadDialog
                    open={uploadOpen}
                    onOpenChange={setUploadOpen}
                    onSubmit={async (payload) => {
                        await create.mutateAsync(payload);
                        toast.success("Image added");
                    }}
                    submitting={create.isPending}
                />
            )}

            <EditDialog
                image={editing}
                onOpenChange={(o) => !o && setEditing(null)}
                onSubmit={async (id, payload) => {
                    await update.mutateAsync({ id, payload });
                    toast.success("Image updated");
                    setEditing(null);
                }}
                submitting={update.isPending}
            />

            <ConfirmDialog
                open={!!pendingDelete}
                onOpenChange={(o) => !o && setPendingDelete(null)}
                title="Delete image?"
                description="This removes the image from the website and deletes the stored file. This cannot be undone."
                confirmLabel="Delete"
                destructive
                loading={remove.isPending}
                onConfirm={confirmDelete}
            />
        </div>
    );
}

/* ---------------- Upload dialog ---------------- */
function UploadDialog({
    open,
    onOpenChange,
    onSubmit,
    submitting,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSubmit: (payload: { title: string; category: string; isPublished: boolean; file: File }) => Promise<void>;
    submitting: boolean;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Pool");
    const [isPublished, setIsPublished] = useState(true);

    const reset = () => {
        setFile(null);
        setPreview(null);
        setTitle("");
        setCategory("Pool");
        setIsPublished(true);
        if (fileRef.current) fileRef.current.value = "";
    };

    const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!f.type.startsWith("image/")) {
            toast.error("Please choose an image file");
            return;
        }
        if (f.size > MAX_BYTES) {
            toast.error("Image exceeds the 5 MB limit");
            return;
        }
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const submit = async () => {
        if (!file) return toast.error("Choose an image to upload");
        if (!title.trim()) return toast.error("Add a title");
        try {
            await onSubmit({ title: title.trim(), category, isPublished, file });
            reset();
            onOpenChange(false);
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) reset();
                onOpenChange(o);
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add gallery image</DialogTitle>
                    <DialogDescription>Upload an image (JPEG, PNG, WebP or GIF, max 5 MB).</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/30 transition hover:bg-muted/50"
                    >
                        {preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={preview} alt="Preview" className="size-full object-cover" />
                        ) : (
                            <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                                <IconUpload className="size-6" />
                                Click to choose an image
                            </span>
                        )}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />

                    <div className="space-y-1.5">
                        <Label htmlFor="g-title">Title</Label>
                        <Input
                            id="g-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Morning lane swim"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="g-category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger id="g-category" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORY_OPTIONS.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                        Publish to website immediately
                    </label>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={submitting || !file}>
                        {submitting && <Spinner className="size-4" />}
                        {submitting ? "Uploading…" : "Add image"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ---------------- Edit dialog ---------------- */
function EditDialog({
    image,
    onOpenChange,
    onSubmit,
    submitting,
}: {
    image: GalleryImage | null;
    onOpenChange: (o: boolean) => void;
    onSubmit: (
        id: string,
        payload: { title: string; category: string; sortOrder: number; isPublished: boolean },
    ) => Promise<void>;
    submitting: boolean;
}) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Pool");
    const [sortOrder, setSortOrder] = useState(0);
    const [isPublished, setIsPublished] = useState(true);
    const [loadedId, setLoadedId] = useState<string | null>(null);

    // Sync local state when a new image is opened.
    if (image && image.id !== loadedId) {
        setLoadedId(image.id);
        setTitle(image.title);
        setCategory(CATEGORY_OPTIONS.includes(image.category) ? image.category : "General");
        setSortOrder(image.sortOrder);
        setIsPublished(image.isPublished);
    }

    const submit = async () => {
        if (!image) return;
        if (!title.trim()) return toast.error("Add a title");
        try {
            await onSubmit(image.id, { title: title.trim(), category, sortOrder, isPublished });
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <Dialog open={!!image} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit image</DialogTitle>
                    <DialogDescription>Update the title, category, order and visibility.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="e-title">Title</Label>
                        <Input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="e-category">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger id="e-category" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORY_OPTIONS.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="e-order">Sort order</Label>
                            <Input
                                id="e-order"
                                type="number"
                                min={0}
                                value={sortOrder}
                                onChange={(e) => setSortOrder(Math.max(0, Number(e.target.value) || 0))}
                            />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                        Published on website
                    </label>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={submitting}>
                        {submitting && <Spinner className="size-4" />}
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function WebsiteGalleryPage() {
    return (
        <PermissionPage permission="gallery.view">
            <GalleryManagerContent />
        </PermissionPage>
    );
}
