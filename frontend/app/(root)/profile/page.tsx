"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { IconCamera, IconLogout, IconUser, IconShieldLock } from "@tabler/icons-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PasswordInput } from "@/components/ui/password-input";
import { DatePicker } from "@/components/ui/date-picker";
import { ImageCropperDialog } from "@/components/ui/image-cropper-dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PageHeader } from "@/components/rbac/page-header";
import { UserStatusBadge } from "@/components/rbac/status-badge";
import { TwoFactorCard } from "@/components/security/two-factor-card";
import { useProfile, useProfileMutations } from "@/hooks/queries/use-profile";
import { AuthService } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";
import { getApiErrorMessage } from "@/lib/api-error";
import { env } from "@/lib/env";
import { avatarColor, initialsOf } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { GENDERS, profileSchema, type ProfileSchema } from "@/schemas/user";
import { changePasswordSchema, ChangePasswordSchema } from "@/schemas/auth";

type ProfileFormValues = ProfileSchema;

type ProfileTab = "profile" | "security";

const NAV: { key: ProfileTab; label: string; icon: typeof IconUser }[] = [
  { key: "profile", label: "Profile", icon: IconUser },
  { key: "security", label: "Security", icon: IconShieldLock },
];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const { data: profile, isLoading } = useProfile();
  const { update, uploadPhoto } = useProfileMutations();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<ProfileTab>("profile");
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: "", lastName: "", phone: "", gender: "", dateOfBirth: "", address: "" },
  });
  const profileErrors = profileForm.formState.errors;

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone ?? "",
        gender: profile.gender ?? "",
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "",
        address: profile.address ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const passwordForm = useForm<ChangePasswordSchema>({ resolver: zodResolver(changePasswordSchema) });
  const [changingPassword, setChangingPassword] = useState(false);

  if (isInitializing || isLoading || !profile) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  const photo = profile.photoUrl
    ? profile.photoUrl.startsWith("http")
      ? profile.photoUrl
      : `${env.apiUrl}${profile.photoUrl}`
    : undefined;
  const memberSince = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—";

  const onSaveProfile = async (values: ProfileFormValues) => {
    try {
      await update.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || null,
        gender: values.gender || null,
        dateOfBirth: values.dateOfBirth || null,
        address: values.address || null,
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  // Pick a file → open the cropper (upload happens after cropping).
  const onPhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    if (fileRef.current) fileRef.current.value = "";
  };

  const closeCropper = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const onCropped = async (cropped: File) => {
    try {
      await uploadPhoto.mutateAsync(cropped);
      toast.success("Photo updated");
      closeCropper();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const onChangePassword = async (values: ChangePasswordSchema) => {
    setChangingPassword(true);
    try {
      await AuthService.changePassword(values.currentPassword, values.newPassword);
      toast.success("Password changed");
      passwordForm.reset();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setChangingPassword(false);
    }
  };

  const logoutAll = async () => {
    try {
      await AuthService.logoutAll();
      toast.success("Signed out of all devices");
      await useAuthStore.getState().logout();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const pErrors = passwordForm.formState.errors;

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Manage your personal details and security." />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left: user details + vertical nav */}
        <aside className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="size-24">
                    <AvatarImage src={photo} alt={profile.firstName} className="object-cover" />
                    <AvatarFallback className={cn("text-2xl font-semibold", avatarColor(profile.id))}>
                      {initialsOf(profile.firstName, profile.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow ring-2 ring-card transition hover:bg-primary/90"
                    aria-label="Change photo"
                  >
                    {uploadPhoto.isPending ? (
                      <Spinner className="size-3.5" />
                    ) : (
                      <IconCamera className="size-4" />
                    )}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden aria-label="Upload profile photo" onChange={onPhotoSelected} />
                </div>
                <p className="mt-3 text-lg font-semibold">
                  {profile.firstName} {profile.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-1">
                  {profile.roles.map((r) => (
                    <Badge key={r.id} variant="secondary" className="text-[10px]">
                      {r.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-2.5">
                <InfoRow label="Status" value={<UserStatusBadge status={profile.status} />} />
                <InfoRow label="User code" value={profile.userCode} />
                <InfoRow label="Member since" value={memberSince} />
              </div>

              {/* Tab nav, inside the details card */}
              <nav className="mt-5 flex gap-1 border-t border-border/60 pt-4 lg:flex-col">
                {NAV.map(({ key, label, icon: Icon }) => {
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={cn(
                        "flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:flex-none",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      {label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Right: forms for the active tab */}
        <div className="min-w-0">
          {tab === "profile" && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Personal details</CardTitle>
                <CardDescription>Update your name and contact information.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName">First name</Label>
                      <Input id="firstName" {...profileForm.register("firstName")} />
                      {profileErrors.firstName && (
                        <p className="text-xs text-destructive">{profileErrors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input id="lastName" {...profileForm.register("lastName")} />
                      {profileErrors.lastName && (
                        <p className="text-xs text-destructive">{profileErrors.lastName.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input value={profile.email ?? ""} disabled />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" {...profileForm.register("phone")} />
                      {profileErrors.phone && (
                        <p className="text-xs text-destructive">{profileErrors.phone.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dateOfBirth">Date of birth</Label>
                      <DatePicker
                        id="dateOfBirth"
                        value={profileForm.watch("dateOfBirth") || ""}
                        onChange={(v) => profileForm.setValue("dateOfBirth", v)}
                        placeholder="Select date of birth"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Gender</Label>
                      <Select
                        value={profileForm.watch("gender") || ""}
                        onValueChange={(v) => profileForm.setValue("gender", v)}
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
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea id="address" rows={2} {...profileForm.register("address")} />
                      {profileErrors.address && (
                        <p className="text-xs text-destructive">{profileErrors.address.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={update.isPending}>
                      {update.isPending ? <Spinner /> : "Save changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {tab === "security" && (
            <div className="space-y-6">
              <TwoFactorCard />

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Change password</CardTitle>
                  <CardDescription>Use a strong, unique password.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="currentPassword">Current password</Label>
                      <PasswordInput
                        id="currentPassword"
                        autoComplete="current-password"
                        {...passwordForm.register("currentPassword")}
                      />
                      {pErrors.currentPassword && (
                        <p className="text-xs text-destructive">{pErrors.currentPassword.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="newPassword">New password</Label>
                        <PasswordInput
                          id="newPassword"
                          autoComplete="new-password"
                          {...passwordForm.register("newPassword")}
                        />
                        {pErrors.newPassword && (
                          <p className="text-xs text-destructive">{pErrors.newPassword.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="confirmPassword">Confirm password</Label>
                        <PasswordInput
                          id="confirmPassword"
                          autoComplete="new-password"
                          {...passwordForm.register("confirmPassword")}
                        />
                        {pErrors.confirmPassword && (
                          <p className="text-xs text-destructive">{pErrors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button type="submit" disabled={changingPassword}>
                        {changingPassword ? <Spinner /> : "Change password"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-0 py-0 shadow-sm">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm">Sign out everywhere</CardTitle>
                    <CardDescription className="text-xs">
                      End every active session on all devices. You&apos;ll need to sign in again.
                    </CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="shrink-0"
                    onClick={logoutAll}
                  >
                    <IconLogout className="size-4" /> Log out of all devices
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <ImageCropperDialog
        open={!!cropSrc}
        onOpenChange={(o) => !o && closeCropper()}
        src={cropSrc}
        onCropped={onCropped}
        loading={uploadPhoto.isPending}
      />
    </div>
  );
}
