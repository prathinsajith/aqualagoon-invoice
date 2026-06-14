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

import { companySchema, CURRENCIES, type CompanySchema } from "@/schemas/company";
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
        invoicePrefix: company.invoicePrefix,
        passPrefix: company.passPrefix,
        currency: company.currency as CompanySchema["currency"],
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
      invoicePrefix: values.invoicePrefix,
      passPrefix: values.passPrefix,
      currency: values.currency,
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
              {errors.tagline && <p className="text-xs text-destructive">{errors.tagline.message}</p>}
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
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input id="website" placeholder="https://…" {...register("website")} />
              {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={2} {...register("address")} />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="invoicePrefix">Invoice prefix</Label>
                <Input
                  id="invoicePrefix"
                  className="uppercase"
                  placeholder="INV"
                  {...register("invoicePrefix")}
                />
                <p className="text-xs text-muted-foreground">
                  e.g. <span className="font-medium">{(watch("invoicePrefix") || "INV").toUpperCase()}-2026-000001</span>
                </p>
                {errors.invoicePrefix && (
                  <p className="text-xs text-destructive">{errors.invoicePrefix.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="passPrefix">Pass prefix</Label>
                <Input
                  id="passPrefix"
                  className="uppercase"
                  placeholder="PASS"
                  {...register("passPrefix")}
                />
                <p className="text-xs text-muted-foreground">
                  e.g. <span className="font-medium">{(watch("passPrefix") || "PASS").toUpperCase()}-2026-000001</span>
                </p>
                {errors.passPrefix && (
                  <p className="text-xs text-destructive">{errors.passPrefix.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={watch("currency") ?? company?.currency ?? ""}
                  onValueChange={(v) => setValue("currency", v as CompanySchema["currency"], { shouldDirty: true })}
                >
                  <SelectTrigger id="currency" className="w-full">
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used for all prices and totals across the app.
                </p>
                {errors.currency && (
                  <p className="text-xs text-destructive">{errors.currency.message}</p>
                )}
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
