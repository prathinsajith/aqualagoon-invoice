"use client";

import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import { SwimLoader } from "@/components/swim-loader";

export default function LoginPage() {
  const loading = useRedirectIfAuthenticated();

  if (loading) {
    return (
      <div className="grid min-h-svh place-items-center bg-gradient-to-br from-[var(--color-aqua-500)] via-[var(--color-aqua-600)] to-[var(--color-aqua-700)]">
        <SwimLoader label="Loading" />
      </div>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Aqua Lagoon account to continue"
      footer={
        <span>
          By continuing you agree to our <Link href="#">Terms</Link> &{" "}
          <Link href="#">Privacy Policy</Link>.
        </span>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
