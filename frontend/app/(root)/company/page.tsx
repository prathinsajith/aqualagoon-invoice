"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconBuildingStore } from "@tabler/icons-react";

import { PageHeader } from "@/components/rbac/page-header";
import { PermissionPage } from "@/components/rbac/permission-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageCropField } from "@/components/image-crop-field";

import { companySchema, type CompanySchema } from "@/schemas/company";
import { CompanyService, DATE_FORMATS, type CompanyPayload } from "@/services/company-service";
import { getApiErrorMessage } from "@/lib/api-error";
import { env } from "@/lib/env";

function resolveLogo(url: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${env.apiUrl}${url}`;
}

function CompanyForm() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ["company"],
    queryFn: CompanyService.get,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<CompanySchema>({ resolver: zodResolver(companySchema) });

  const dateFormat = watch("dateFormat");

  // Hydrate the form once the company loads.
  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        tagline: company.tagline ?? "",
        email: company.email ?? "",
        phone: company.phone ?? "",
        website: company.website ?? "",
        address: company.address ?? "",
        userCodePrefix: company.userCodePrefix,
        dateFormat: company.dateFormat,
      });
    }
  }, [company, reset]);

  const update = useMutation({
    mutationFn: (payload: CompanyPayload) => CompanyService.update(payload),
    onSuccess: (data) => {
      qc.setQueryData(["company"], data);
      toast.success("Company details saved");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const onSubmit = (values: CompanySchema) =>
    update.mutate({
      name: values.name,
      tagline: values.tagline || null,
      email: values.email || null,
      phone: values.phone || null,
      website: values.website || null,
      address: values.address || null,
      userCodePrefix: values.userCodePrefix,
      dateFormat: values.dateFormat,
    });

  const onLogoCropped = async (file: File) => {
    setUploading(true);
    try {
      const data = await CompanyService.uploadLogo(file);
      qc.setQueryData(["company"], data);
      toast.success("Logo updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  if (isLoading && !company) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  const logo = resolveLogo(company?.logoUrl ?? null);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      {/* Logo */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Logo</CardTitle>
          <CardDescription>Shown across the app and in emails.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageCropField
            value={logo}
            onCropped={onLogoCropped}
            shape="square"
            sizeClass="size-32"
            changeLabel="Change logo"
            busy={uploading}
            fallback={<IconBuildingStore className="size-10 text-muted-foreground/50" />}
          />
        </CardContent>
      </Card>

      {/* Details */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Company details</CardTitle>
          <CardDescription>Contact information and branding for your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Company name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" placeholder="Swimming Pool & Kids Water Park" {...register("tagline")} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Contact email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input id="website" placeholder="https://…" {...register("website")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={2} {...register("address")} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="userCodePrefix">User code prefix</Label>
                <Input
                  id="userCodePrefix"
                  className="uppercase"
                  placeholder="USR"
                  {...register("userCodePrefix")}
                />
                <p className="text-xs text-muted-foreground">
                  New users get codes like{" "}
                  <span className="font-medium">{(watch("userCodePrefix") || "USR").toUpperCase()}-A1B2C3</span>.
                </p>
                {errors.userCodePrefix && (
                  <p className="text-xs text-destructive">{errors.userCodePrefix.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dateFormat">Date format</Label>
                <Select
                  value={dateFormat ?? company?.dateFormat ?? ""}
                  onValueChange={(v) => setValue("dateFormat", v, { shouldDirty: true })}
                >
                  <SelectTrigger id="dateFormat" className="w-full">
                    <SelectValue placeholder="Select a date format" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={update.isPending || !isDirty}>
                {update.isPending ? <Spinner /> : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompanyPage() {
  return (
    <PermissionPage permission="setting.manage">
      <div className="space-y-6">
        <PageHeader title="Company" description="Manage your organization's profile and branding." />
        <CompanyForm />
      </div>
    </PermissionPage>
  );
}
