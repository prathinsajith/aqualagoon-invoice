import Link from "next/link";
import { IconError404, IconArrowLeft } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

/** Branded 404 for unknown routes. */
export default function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
          <IconError404 className="size-8" />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or may have moved.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">
            <IconArrowLeft className="size-4" /> Back to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
