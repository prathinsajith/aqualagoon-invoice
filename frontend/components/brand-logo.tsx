"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCompany } from "@/hooks/useCompany";
import { env } from "@/lib/env";

/** Brand lockup used in the header — reflects the company logo/name from settings. */
export function BrandLogo({ className }: { className?: string }) {
  const { data: company } = useCompany();

  const logo = company?.logoUrl
    ? company.logoUrl.startsWith("http")
      ? company.logoUrl
      : `${env.apiUrl}${company.logoUrl}`
    : "/aqua-lagoon-logo.jpg";
  const name = company?.name || "Aqua Lagoon";

  return (
    <Link href="/dashboard" className={cn("flex items-center gap-2", className)} aria-label={name}>
      <span className="flex items-center justify-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/5">
        {/* Company logo can be a backend URL, so a plain img avoids next/image remote config. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} className="h-9 w-9 object-contain" />
      </span>
      <span className="hidden max-w-[12rem] truncate text-base font-extrabold leading-none tracking-tight text-primary sm:inline">
        {name}
      </span>
    </Link>
  );
}
