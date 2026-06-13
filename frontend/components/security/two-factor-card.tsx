"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconShieldCheck, IconShieldLock, IconKey } from "@tabler/icons-react";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { RecoveryCodesView } from "@/components/security/recovery-codes-view";
import { AuthService } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";
import { getApiErrorMessage } from "@/lib/api-error";
import type { TwoFactorSetup } from "@/types/rbac";

function OtpField({ value, onChange, onComplete, disabled }: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-center">
      <InputOTP maxLength={6} value={value} onChange={onChange} onComplete={onComplete} disabled={disabled} autoFocus>
        <InputOTPGroup>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

type Mode = "idle" | "enable" | "disable" | "regenerate";

export function TwoFactorCard() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const enabled = user?.twoFactorEnabled ?? false;
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>("idle");
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // When set, the active dialog switches to showing these (one-time) codes.
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  // How many recovery codes are left (only meaningful while 2FA is enabled).
  const statusQ = useQuery({
    queryKey: ["2fa-recovery-status"],
    queryFn: () => AuthService.recoveryCodesStatus(),
    enabled,
  });

  const refreshUser = async () => {
    try {
      setUser(await AuthService.me());
    } catch {
      /* non-fatal */
    }
  };

  const openEnable = async () => {
    setMode("enable");
    setSetup(null);
    setCode("");
    setRecoveryCodes(null);
    setLoadingSetup(true);
    try {
      setSetup(await AuthService.setupTwoFactor());
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setMode("idle");
    } finally {
      setLoadingSetup(false);
    }
  };

  const submitEnable = async (value: string) => {
    if (value.length < 6) return;
    setSubmitting(true);
    try {
      const { recoveryCodes } = await AuthService.enableTwoFactor(value);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["2fa-recovery-status"] });
      setRecoveryCodes(recoveryCodes); // stay open to show the codes
      setCode("");
      toast.success("Two-factor authentication enabled");
    } catch (err) {
      setCode("");
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const submitRegenerate = async (value: string) => {
    if (value.length < 6) return;
    setSubmitting(true);
    try {
      const { recoveryCodes } = await AuthService.regenerateRecoveryCodes(value);
      queryClient.invalidateQueries({ queryKey: ["2fa-recovery-status"] });
      setRecoveryCodes(recoveryCodes);
      setCode("");
      toast.success("Recovery codes regenerated");
    } catch (err) {
      setCode("");
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisable = async (value: string) => {
    if (value.length < 6) return;
    setSubmitting(true);
    try {
      await AuthService.disableTwoFactor(value);
      await refreshUser();
      toast.success("Two-factor authentication disabled");
      close();
    } catch (err) {
      setCode("");
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setMode("idle");
    setSetup(null);
    setCode("");
    setRecoveryCodes(null);
  };

  const remaining = statusQ.data?.remaining;
  const lowOnCodes = typeof remaining === "number" && remaining <= 2;

  return (
    <Card className="border-0 py-0 shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Two-factor authentication</CardTitle>
            {enabled ? (
              <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary">Disabled</Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Add an extra layer of security using an authenticator app (Google Authenticator, Authy…).
          </CardDescription>
          {enabled && typeof remaining === "number" && (
            <p className={`text-xs ${lowOnCodes ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
              {remaining} of {statusQ.data?.total} recovery codes remaining
              {lowOnCodes && " — regenerate soon"}
            </p>
          )}
        </div>
        {enabled ? (
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMode("regenerate");
                setCode("");
                setRecoveryCodes(null);
              }}
            >
              <IconKey className="size-4" /> Recovery codes
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMode("disable")}>
              <IconShieldLock className="size-4" /> Disable
            </Button>
          </div>
        ) : (
          <Button size="sm" className="shrink-0" onClick={openEnable}>
            <IconShieldCheck className="size-4" /> Enable 2FA
          </Button>
        )}
      </CardContent>

      {/* Enable dialog — QR step, then recovery-codes step */}
      <Dialog open={mode === "enable"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          {recoveryCodes ? (
            <>
              <DialogHeader>
                <DialogTitle>Save your recovery codes</DialogTitle>
                <DialogDescription>
                  Use one of these if you ever lose access to your authenticator app.
                </DialogDescription>
              </DialogHeader>
              <RecoveryCodesView codes={recoveryCodes} accountEmail={user?.email ?? undefined} />
              <DialogFooter>
                <Button onClick={close}>I&apos;ve saved my codes</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Set up two-factor authentication</DialogTitle>
                <DialogDescription>
                  Scan the QR code with your authenticator app, then enter the 6-digit code.
                </DialogDescription>
              </DialogHeader>

              {loadingSetup || !setup ? (
                <div className="grid h-56 place-items-center">
                  <Spinner className="size-7" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={setup.qrCode}
                      alt="2FA QR code"
                      className="size-44 rounded-lg border bg-white p-2"
                    />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-xs text-muted-foreground">Or enter this key manually</p>
                    <code className="break-all rounded bg-muted px-2 py-1 text-xs font-medium">
                      {setup.secret}
                    </code>
                  </div>
                  <OtpField value={code} onChange={setCode} onComplete={submitEnable} disabled={submitting} />
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={close} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={() => submitEnable(code)} disabled={code.length < 6 || submitting || !setup}>
                  {submitting ? <Spinner /> : "Enable"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Regenerate recovery codes dialog — verify step, then codes step */}
      <Dialog open={mode === "regenerate"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          {recoveryCodes ? (
            <>
              <DialogHeader>
                <DialogTitle>Your new recovery codes</DialogTitle>
                <DialogDescription>
                  Your previous codes no longer work. Save these new ones.
                </DialogDescription>
              </DialogHeader>
              <RecoveryCodesView codes={recoveryCodes} accountEmail={user?.email ?? undefined} />
              <DialogFooter>
                <Button onClick={close}>I&apos;ve saved my codes</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Regenerate recovery codes</DialogTitle>
                <DialogDescription>
                  Enter a current code from your authenticator app. This invalidates your existing
                  recovery codes.
                </DialogDescription>
              </DialogHeader>
              <OtpField value={code} onChange={setCode} onComplete={submitRegenerate} disabled={submitting} />
              <DialogFooter>
                <Button variant="outline" onClick={close} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={() => submitRegenerate(code)} disabled={code.length < 6 || submitting}>
                  {submitting ? <Spinner /> : "Regenerate"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable dialog */}
      <Dialog open={mode === "disable"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable two-factor authentication</DialogTitle>
            <DialogDescription>Enter a current code from your authenticator app to confirm.</DialogDescription>
          </DialogHeader>
          <OtpField value={code} onChange={setCode} onComplete={submitDisable} disabled={submitting} />
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => submitDisable(code)}
              disabled={code.length < 6 || submitting}
            >
              {submitting ? <Spinner /> : "Disable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
