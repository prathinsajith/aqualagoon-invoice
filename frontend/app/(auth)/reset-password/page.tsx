"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth-shell";
import { AuthService } from "@/services/auth-service";
import { getApiErrorMessage } from "@/lib/api-error";
import { resetPasswordSchema, ResetPasswordSchema } from "@/schemas/auth";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: tokenFromUrl },
  });

  useEffect(() => {
    if (tokenFromUrl) setValue("token", tokenFromUrl);
  }, [tokenFromUrl, setValue]);

  const onSubmit = async (data: ResetPasswordSchema) => {
    try {
      await AuthService.resetPassword(data.token, data.newPassword);
      toast.success("Your password has been reset. Please sign in.");
      router.push("/login");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {!tokenFromUrl && (
        <Field>
          <FieldLabel htmlFor="token">Reset token</FieldLabel>
          <Input id="token" type="text" {...register("token")} />
          <FieldError errors={errors.token ? [errors.token] : []} />
        </Field>
      )}
      <Field>
        <FieldLabel htmlFor="newPassword">New password</FieldLabel>
        <PasswordInput id="newPassword" autoComplete="new-password" {...register("newPassword")} />
        <FieldError errors={errors.newPassword ? [errors.newPassword] : []} />
      </Field>
      <Field>
        <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        <FieldError errors={errors.confirmPassword ? [errors.confirmPassword] : []} />
      </Field>
      <Button type="submit" disabled={isSubmitting} className="w-full font-bold">
        {isSubmitting ? (
          <>
            Resetting <Spinner />
          </>
        ) : (
          "Reset password"
        )}
      </Button>
      <Link href="/login" className="text-center text-sm text-muted-foreground hover:text-primary">
        Back to sign in
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Reset password" subtitle="Choose a new password for your account">
      <Suspense fallback={<Spinner className="mx-auto size-6" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
