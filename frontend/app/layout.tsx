import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { QueryProvider } from "@/components/providers/query-provider";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aqua Lagoon",
  description: "Aqua Lagoon — Swimming Pool .",
  keywords: ["aqualagoon", "swimming pool", "admin", "dashboard", "management"],
  authors: [{ name: "Aqua Lagoon Team" }],
  applicationName: "Aqua Lagoon",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aqua Lagoon",
  },
  openGraph: {
    title: "Aqua Lagoon",
    description: "Swimming pool management admin platform",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0ea5e9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c4a6e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased font-sans`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <QueryProvider>{children}</QueryProvider>
            <Toaster richColors position="top-right" />
            <ServiceWorkerRegister />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
