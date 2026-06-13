"use client";

import { BrandLogo } from "@/components/brand-logo";
import { MainNav } from "@/components/main-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationsButton } from "@/components/notifications-button";
import { UserAvatarDialog } from "@/components/user-avatar-dialog";
import { NAVBAR_DATA } from "@/lib/constant";
import { User } from "@/stores/auth-store";

export function Header({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-4 lg:px-8">
        <BrandLogo />

        {/* Desktop primary nav (mobile uses the bottom nav) */}
        <div className="hidden flex-1 justify-center lg:flex">
          <MainNav items={NAVBAR_DATA.navMain} />
        </div>

        {/* Right-side actions */}
        <div className="ml-auto flex items-center gap-1.5">
          <ModeToggle />
          <NotificationsButton />
          <div className="ml-1 border-l border-border/60 pl-2.5">
            <UserAvatarDialog user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
