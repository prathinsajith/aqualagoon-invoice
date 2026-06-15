import type { MetadataRoute } from "next";

/**
 * PWA web app manifest (served by Next at /manifest.webmanifest). Makes the
 * admin installable to a phone/desktop home screen as a standalone app.
 */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Aqua Lagoon Admin",
        short_name: "Aqua Lagoon",
        description: "Aqua Lagoon — Swimming Pool.",
        // Opens the app at the dashboard; the proxy redirects to /login if needed.
        start_url: "/dashboard",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#ffffff",
        theme_color: "#0ea5e9",
        categories: ["business", "productivity"],
        icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            {
                src: "/icons/icon-maskable-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };
}
