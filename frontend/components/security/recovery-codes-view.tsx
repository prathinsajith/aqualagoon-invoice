"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconCopy, IconCheck, IconDownload, IconAlertTriangle } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { useCompany } from "@/hooks/useCompany";

/**
 * Displays a freshly generated set of 2FA recovery codes with copy + download
 * actions. The codes are shown exactly once, so the UI nudges the user to save
 * them before continuing.
 */
export function RecoveryCodesView({
  codes,
  accountEmail,
}: {
  codes: string[];
  accountEmail?: string;
}) {
  const [copied, setCopied] = useState(false);
  const { data: company } = useCompany();
  const companyName = company?.name || "Aqua Lagoon";
  const fileSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "recovery";

  const fileText = [
    `${companyName} — Two-factor recovery codes`,
    accountEmail ? `Account: ${accountEmail}` : null,
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "Keep these codes somewhere safe. Each code can be used once to sign in if",
    "you lose access to your authenticator app.",
    "",
    ...codes.map((c) => `  ${c}`),
    "",
    "After a code is used it cannot be used again. You can regenerate codes",
    "anytime from Profile → Security.",
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");

  const download = () => {
    const blob = new Blob([fileText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileSlug}-recovery-codes.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Recovery codes downloaded");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      toast.success("Recovery codes copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p className="text-xs leading-relaxed">
          Save these codes now — they won&apos;t be shown again. Each one can be used once to sign in
          if you lose your authenticator.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3">
        {codes.map((code) => (
          <code
            key={code}
            className="rounded bg-background py-1.5 text-center font-mono text-sm tracking-wider"
          >
            {code}
          </code>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={download}>
          <IconDownload className="size-4" /> Download
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={copy}>
          {copied ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
