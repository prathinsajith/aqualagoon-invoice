"use client";

import { useSyncExternalStore } from "react";
import { IconDownload, IconShare2 } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** The non-standard event Chromium fires when the app is installable. */
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Mode = "native" | "ios" | "none";
interface Snapshot {
    prompt: BeforeInstallPromptEvent | null;
    mode: Mode;
}

const isIos = (): boolean =>
    typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

const isStandalone = (): boolean =>
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari exposes this legacy flag instead of display-mode.
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);

// --- Module-level install store (driven by browser events, not React state).
// Using useSyncExternalStore keeps this hydration-safe and avoids setState-in-effect.
const SERVER_SNAPSHOT: Snapshot = { prompt: null, mode: "none" };
let deferred: BeforeInstallPromptEvent | null = null;
let snapshot: Snapshot = SERVER_SNAPSHOT;
let initialized = false;
const listeners = new Set<() => void>();

function recompute(): void {
    let mode: Mode = "none";
    if (!isStandalone()) {
        if (deferred) mode = "native";
        else if (isIos()) mode = "ios"; // iOS has no install prompt API
    }
    snapshot = { prompt: deferred, mode };
    listeners.forEach((l) => l());
}

function init(): void {
    if (initialized || typeof window === "undefined") return;
    initialized = true;
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault(); // suppress the default mini-infobar; we drive install ourselves
        deferred = e as BeforeInstallPromptEvent;
        recompute();
    });
    window.addEventListener("appinstalled", () => {
        deferred = null;
        recompute();
    });
    recompute(); // initial client snapshot (covers iOS / already-standalone)
}

function subscribe(onChange: () => void): () => void {
    init();
    listeners.add(onChange);
    return () => listeners.delete(onChange);
}

/**
 * "Install app" button for the header. On Chrome/Edge/Android it triggers the
 * native install prompt; on iOS Safari (no prompt API) it shows Add-to-Home-Screen
 * instructions. Renders nothing once installed or when install isn't available.
 */
export function InstallButton() {
    const { prompt, mode } = useSyncExternalStore(
        subscribe,
        () => snapshot,
        () => SERVER_SNAPSHOT,
    );

    if (mode === "none") return null;

    const handleClick = async () => {
        if (mode === "native" && prompt) {
            await prompt.prompt();
            await prompt.userChoice;
            deferred = null; // a prompt can only be used once
            recompute();
            return;
        }
        // iOS fallback — installation is manual.
        toast.info("Install Aqua Lagoon", {
            description: "Tap the Share button, then “Add to Home Screen”.",
            icon: <IconShare2 className="size-4" />,
            duration: 6000,
        });
    };

    return (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleClick}>
            <IconDownload className="size-4" />
            <span className="hidden sm:inline">Install app</span>
        </Button>
    );
}
