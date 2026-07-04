"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconShieldLock, IconCircleCheckFilled, IconUser } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ImageCropField } from "@/components/image-crop-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { editUserSchema, EditUserSchema, GENDERS, USER_STATUSES } from "@/schemas/user";
import { useUserMutations } from "@/hooks/queries/use-users";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";
import type { ManagedUser, Role } from "@/types/rbac";
import { UserService, type UserPayload } from "@/services/user-service";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null/undefined → create mode; a user → edit mode. */
  user?: ManagedUser | null;
  /** Called with the freshly created user (create mode only). */
  onCreated?: (user: ManagedUser) => void;
}

const emptyDefaults: EditUserSchema = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  status: "ACTIVE",
  roleIds: [],
};

/** Stable empty fallback so `roles` keeps a constant identity while loading. */
const EMPTY_ROLES: Role[] = [];

/** Selected-state colors for the status switch, matching the status badges. */
const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-300",
  INACTIVE: "bg-gray-200 text-gray-700 shadow-sm dark:bg-gray-700 dark:text-gray-200",
  SUSPENDED: "bg-red-100 text-red-700 shadow-sm dark:bg-red-900/40 dark:text-red-300",
};

export function UserFormDialog({ open, onOpenChange, user, onCreated }: UserFormDialogProps) {
  const isEdit = !!user;
  const qc = useQueryClient();
  const { create, update } = useUserMutations();
  // Only the roles this actor is allowed to assign (admins get all). The backend
  // enforces this too — this just keeps the picker honest for non-admins.
  // NB: fall back to a STABLE empty array — a `= []` default would mint a new
  // reference each render and loop the sync effect that depends on `roles`.
  const { data: rolesData } = useQuery({
    queryKey: ["users", "assignable-roles"],
    queryFn: UserService.assignableRoles,
    enabled: open,
  });
  const roles = rolesData ?? EMPTY_ROLES;
  const guestId = roles.find((r) => r.name === "Guest")?.id;
  // Ensures the Guest default is applied at most once per open.
  const guestDefaultedRef = useRef(false);

  // Photo: edit uploads immediately; create stashes the cropped file until the
  // user exists, then uploads it. `preview` shows the chosen image right away.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const existingPhoto = user?.photoUrl
    ? user.photoUrl.startsWith("http")
      ? user.photoUrl
      : `${env.apiUrl}${user.photoUrl}`
    : undefined;
  const photoValue = photoPreview ?? existingPhoto;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditUserSchema>({
    resolver: zodResolver(editUserSchema),
    defaultValues: emptyDefaults,
  });

  // Clear the staged photo the moment the dialog opens — done during render
  // with a prev-prop comparison (not an effect) so there's no extra commit with
  // a stale preview. See react.dev "adjusting some state when a prop changes".
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  }

  // Sync the form whenever the dialog opens for a (different) user. Does NOT
  // depend on `roles`, so loading the roles list never wipes in-progress input.
  useEffect(() => {
    if (!open) {
      guestDefaultedRef.current = false;
      return;
    }
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email ?? "",
        phone: user.phone ?? "",
        password: "",
        gender: (user.gender as EditUserSchema["gender"]) ?? "",
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
        address: user.address ?? "",
        status: user.status,
        roleIds: user.roles.map((r) => r.id),
      });
    } else {
      reset(emptyDefaults);
    }
  }, [open, user, reset]);

  // New users always start as a Guest. Applied once the roles load (and only
  // once), so it survives async loading without clobbering other fields.
  useEffect(() => {
    if (!open || user || guestDefaultedRef.current || !guestId) return;
    setValue("roleIds", [guestId]);
    guestDefaultedRef.current = true;
  }, [open, user, guestId, setValue]);

  const selectedRoleIds = watch("roleIds") ?? [];
  const status = watch("status");
  const gender = watch("gender");

  // Customer roles (Guest/Student) don't log in: email is optional and no
  // password is set here. Login roles require an email and get a setup link;
  // customer roles (Guest/Student) don't.
  const selectedRoleNames = useMemo(
    () => roles.filter((r) => selectedRoleIds.includes(r.id)).map((r) => r.name),
    [roles, selectedRoleIds],
  );
  const isLoginUser = useMemo(
    () => selectedRoleNames.some((n) => n !== "Guest" && n !== "Student"),
    [selectedRoleNames],
  );

  const toggleRole = (roleId: string) => {
    // Guest is the mandatory base role on a new user — it can't be removed here.
    if (!isEdit && roleId === guestId) return;
    const next = selectedRoleIds.includes(roleId)
      ? selectedRoleIds.filter((id) => id !== roleId)
      : [...selectedRoleIds, roleId];
    setValue("roleIds", next, { shouldDirty: true });
  };

  const onPhotoCropped = async (file: File) => {
    setPhotoPreview(URL.createObjectURL(file));
    if (isEdit && user) {
      // Edit: upload right away against the existing user.
      setUploadingPhoto(true);
      try {
        await UserService.uploadPhoto(user.id, file);
        qc.invalidateQueries({ queryKey: ["users"] });
        toast.success("Photo updated");
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      } finally {
        setUploadingPhoto(false);
      }
    } else {
      // Create: hold the file until the user is created.
      setPhotoFile(file);
    }
  };

  const onSubmit = async (values: EditUserSchema) => {
    // Login users (Admin/Staff/Coach) must have an email; customers (Guest/Student) need not.
    if (isLoginUser && !values.email) {
      setError("email", { message: "Email is required for admin, staff or coach users" });
      return;
    }

    const payload: UserPayload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email || null,
      // New users are always created Active; status is only editable when editing.
      status: isEdit ? values.status : "ACTIVE",
      roleIds: values.roleIds ?? [],
      phone: values.phone || undefined,
      gender: values.gender || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      address: values.address || undefined,
    };

    try {
      if (isEdit && user) {
        await update.mutateAsync({ id: user.id, payload });
        toast.success("User updated");
      } else {
        const created = await create.mutateAsync(payload);
        // Upload the cropped photo now that the user exists.
        if (photoFile) {
          await UserService.uploadPhoto(created.id, photoFile).catch(() => {});
          qc.invalidateQueries({ queryKey: ["users"] });
        }
        toast.success("User created");
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Create user"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this user's details, status and roles."
              : "Add a new user and assign their roles."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ImageCropField
            value={photoValue}
            onCropped={onPhotoCropped}
            shape="circle"
            busy={uploadingPhoto}
            changeLabel="Upload photo"
            fallback={<IconUser className="size-8 text-muted-foreground/50" />}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">
                Email{" "}
                {isLoginUser ? (
                  <span className="text-destructive">*</span>
                ) : (
                  <span className="font-normal text-muted-foreground">(optional)</span>
                )}
              </Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <DatePicker
                id="dateOfBirth"
                value={watch("dateOfBirth") || ""}
                onChange={(v) => setValue("dateOfBirth", v)}
                placeholder="Select date of birth"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select
                value={gender || ""}
                onValueChange={(v) => setValue("gender", v as EditUserSchema["gender"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={2} {...register("address")} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Roles &amp; access</Label>
              <span className="text-xs text-muted-foreground">{selectedRoleIds.length} selected</span>
            </div>
            {roles.length === 0 ? (
              <p className="text-xs text-muted-foreground">No roles available.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {roles.map((role) => {
                  const active = selectedRoleIds.includes(role.id);
                  const locked = !isEdit && role.id === guestId;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRole(role.id)}
                      aria-pressed={active}
                      title={locked ? "Guest is included by default" : undefined}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all",
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/40 hover:bg-muted/50",
                        locked && "cursor-default",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <IconShieldLock className="size-4" />
                      </span>
                      <span className="min-w-0 truncate text-sm font-medium">{role.name}</span>
                      {locked ? (
                        <span className="absolute right-2 top-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Default
                        </span>
                      ) : active ? (
                        <IconCircleCheckFilled className="absolute right-2 top-2 size-4 text-primary" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status — only editable when editing; new users are always Active. */}
          {isEdit && (
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="inline-flex w-full gap-1 rounded-lg bg-muted/40 p-1 sm:w-auto">
                {USER_STATUSES.map((s) => {
                  const selected = status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setValue("status", s, { shouldDirty: true })}
                      className={cn(
                        "flex flex-1 items-center justify-center rounded-md px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none",
                        selected ? STATUS_STYLES[s] : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  Saving <Spinner />
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create user"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
