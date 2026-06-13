"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Public (unauthenticated) routes that always render in light mode. */
const LIGHT_ONLY_PREFIXES = ["/login", "/forgot-password", "/reset-password"];

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname();
  const forceLight = LIGHT_ONLY_PREFIXES.some((p) => pathname?.startsWith(p));

  return (
    <NextThemesProvider {...props} forcedTheme={forceLight ? "light" : props.forcedTheme}>
      {children}
    </NextThemesProvider>
  );
}
