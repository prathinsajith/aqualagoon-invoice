"use client";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { useInitializeAuth } from "@/hooks/useInitializeAuth";
import { useAuthStore } from "@/stores/auth-store";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useInitializeAuth(); // silent token refresh on load (browser only)

  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex min-h-svh flex-col bg-muted/30 pb-16 lg:pb-0">
      <Header user={user} />
      <main className="@container/main mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 lg:px-8">
        {children}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
