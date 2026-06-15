/*
 * Aqua Lagoon PWA service worker.
 *
 * Strategy: network-first for same-origin GETs — always fresh when online, and
 * falls back to the cache when offline. It deliberately does NOT intercept:
 *   - cross-origin requests (the backend API) — auth tokens + live data stay untouched,
 *   - same-origin /api/* routes (the Next auth proxy / route handlers).
 * So nothing sensitive is ever cached; only the static app shell is.
 */
const CACHE = "aqua-lagoon-v1";

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
            await self.clients.claim();
        })(),
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return; // leave the backend API alone
    if (url.pathname.startsWith("/api/")) return; // leave the auth proxy routes alone

    event.respondWith(
        (async () => {
            try {
                const fresh = await fetch(request);
                const cache = await caches.open(CACHE);
                cache.put(request, fresh.clone());
                return fresh;
            } catch {
                const cached = await caches.match(request);
                if (cached) return cached;
                if (request.mode === "navigate") {
                    const fallback = await caches.match("/dashboard");
                    if (fallback) return fallback;
                }
                throw new Error("Offline and resource not cached");
            }
        })(),
    );
});
