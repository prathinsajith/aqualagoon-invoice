"use client";

import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useCompany } from "@/hooks/useCompany";

export function Footer() {
  const { data: company } = useCompany();
  const name = company?.name || "Aqua Lagoon";
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-background/80 backdrop-blur-md shadow-[0_-5px_30px_-15px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col sm:flex-row sm:h-14 items-center justify-between px-4 lg:px-6 py-3 sm:py-0 gap-3 sm:gap-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            © {year} {name}. All rights reserved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <Link
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Separator orientation="vertical" className="hidden sm:block h-4" />
          <Link
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>
          <Separator orientation="vertical" className="hidden sm:block h-4" />
          <Link
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
