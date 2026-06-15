"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker (prod only — registering in dev would cache
 * stale Next.js chunks and cause confusing reloads). Renders nothing.
 */
export function ServiceWorkerRegister() {
    useEffect(() => {
        if (process.env.NODE_ENV !== "production") return;
        if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

        const register = () => {
            navigator.serviceWorker.register("/sw.js").catch(() => {
                // Registration failures are non-fatal — the app still works online.
            });
        };
        window.addEventListener("load", register);
        return () => window.removeEventListener("load", register);
    }, []);

    return null;
}
