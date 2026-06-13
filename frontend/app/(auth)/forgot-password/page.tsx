"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth-shell";
import { AuthService } from "@/services/auth-service";
import { getApiErrorMessage } from "@/lib/api-error";
import { forgotPasswordSchema, ForgotPasswordSchema } from "@/schemas/auth";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconCircleCheck } from "@tabler/icons-react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordSchema>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    try {
      const res = await AuthService.forgotPassword(data.identifier);
      setResetToken(res.resetToken ?? null);
      setSent(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <AuthShell
      title="Forgot password?"
      subtitle="Enter your email or phone and we'll send reset instructions"
    >
      {sent ? (
        <div className="flex flex-col gap-4">
          <Alert>
            <IconCircleCheck />
            <AlertTitle>Check your inbox</AlertTitle>
            <AlertDescription>
              If an account matches, password reset instructions have been sent.
            </AlertDescription>
          </Alert>
          {resetToken && (
            <p className="text-xs text-muted-foreground">
              Dev mode — no mailer configured. Continue with your{" "}
              <Link
                href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                className="text-primary underline underline-offset-4"
              >
                reset link
              </Link>
              .
            </p>
          )}
          <Button variant="outline" asChild className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="identifier">Email or phone</FieldLabel>
            <Input id="identifier" type="text" placeholder="you@example.com" {...register("identifier")} />
            <FieldError errors={errors.identifier ? [errors.identifier] : []} />
          </Field>
          <Button type="submit" disabled={isSubmitting} className="w-full font-bold">
            {isSubmitting ? (
              <>
                Sending <Spinner />
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
          <Link
            href="/login"
            className="text-center text-sm text-muted-foreground hover:text-primary"
          >
            Back to sign in
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
