import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconExclamationCircle } from "@tabler/icons-react";

import { AuthService, isTwoFactorChallenge } from "@/services/auth-service";
import { getApiErrorMessage } from "@/lib/api-error";
import { loginSchema, LoginSchema } from "@/schemas/auth";
import { fullName, useAuthStore } from "@/stores/auth-store";
import type { AuthResult } from "@/types/rbac";

/**
 * Resolves the post-login destination from the `?next=` param the proxy adds
 * when redirecting an unauthenticated visitor. Only same-origin relative paths
 * are honored (guards against open-redirect); anything else falls back to the
 * dashboard.
 */
function safeNextPath(): string {
  if (typeof window === "undefined") return "/dashboard";
  const next = new URLSearchParams(window.location.search).get("next");
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) {
    return next;
  }
  return "/dashboard";
}

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const { setToken, setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({ resolver: zodResolver(loginSchema) });

  // Stores the session and navigates to the dashboard.
  const completeLogin = async (result: AuthResult) => {
    setToken(result.accessToken);
    setUser(result.user);
    await fetch("/api/auth/store-refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: result.refreshToken }),
    });
    toast.success(`Welcome back, ${fullName(result.user)}!`);
    setRedirecting(true);
    // Hard navigation (not router.push): guarantees the just-set refresh_token
    // cookie is sent with the request and bypasses any cached RSC redirect from
    // a logged-out prefetch (which would otherwise replay /dashboard → /login
    // and hang here). useInitializeAuth re-mints the access token on load.
    window.location.assign(safeNextPath());
  };

  const onSubmit = async (data: LoginSchema): Promise<void> => {
    setServerError(null);
    try {
      const result = await AuthService.login(data.identifier, data.password);
      if (isTwoFactorChallenge(result)) {
        setMfaToken(result.mfaToken);
        return;
      }
      await completeLogin(result);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Unable to sign in. Please try again.");
      setServerError(msg);
      toast.error(msg);
    }
  };

  const verifyCode = async (code: string) => {
    if (!mfaToken || code.length < 6) return;
    setServerError(null);
    setVerifying(true);
    try {
      const result = await AuthService.loginTwoFactor(mfaToken, code);
      await completeLogin(result);
    } catch (err) {
      setOtp("");
      setRecoveryCode("");
      const msg = getApiErrorMessage(err, "Invalid authentication code.");
      setServerError(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const busy = isSubmitting || redirecting;

  // --- Step 2: 2FA code -----------------------------------------------------
  if (mfaToken) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        {serverError && (
          <Alert>
            <IconExclamationCircle />
            <AlertTitle>Verification failed</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium">Two-factor authentication</p>
          <p className="text-sm text-muted-foreground">
            {useRecovery
              ? "Enter one of your saved recovery codes."
              : "Enter the 6-digit code from your authenticator app."}
          </p>
        </div>

        {useRecovery ? (
          <Input
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verifyCode(recoveryCode)}
            placeholder="XXXXX-XXXXX"
            autoComplete="one-time-code"
            autoFocus
            disabled={verifying || redirecting}
            className="text-center font-mono tracking-wider"
          />
        ) : (
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              onComplete={verifyCode}
              disabled={verifying || redirecting}
              autoFocus
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        )}

        <Button
          type="button"
          className="w-full font-bold"
          disabled={(useRecovery ? recoveryCode.trim().length < 6 : otp.length < 6) || verifying || redirecting}
          onClick={() => verifyCode(useRecovery ? recoveryCode.trim() : otp)}
        >
          {verifying || redirecting ? (
            <>
              Verifying <Spinner />
            </>
          ) : (
            "Verify & sign in"
          )}
        </Button>

        <button
          type="button"
          onClick={() => {
            setUseRecovery((v) => !v);
            setOtp("");
            setRecoveryCode("");
            setServerError(null);
          }}
          className="text-center text-sm text-muted-foreground hover:text-primary"
        >
          {useRecovery ? "Use your authenticator app instead" : "Use a recovery code instead"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMfaToken(null);
            setOtp("");
            setRecoveryCode("");
            setUseRecovery(false);
            setServerError(null);
          }}
          className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <IconArrowLeft className="size-4" /> Back to sign in
        </button>
      </div>
    );
  }

  // --- Step 1: credentials --------------------------------------------------
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col gap-6">
        {serverError && (
          <Alert>
            <IconExclamationCircle />
            <AlertTitle>Sign in failed</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="identifier">Email or phone</FieldLabel>
          <Input
            id="identifier"
            type="text"
            autoComplete="username"
            placeholder="you@example.com"
            {...register("identifier")}
          />
          <FieldError errors={errors.identifier ? [errors.identifier] : []} />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="password" autoComplete="current-password" {...register("password")} />
          <FieldError errors={errors.password ? [errors.password] : []} />
        </Field>

        <Field>
          <Button type="submit" disabled={busy} className="w-full font-bold">
            {busy ? (
              <>
                Signing in <Spinner />
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </Field>
      </div>
    </form>
  );
}
