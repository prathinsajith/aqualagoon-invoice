import type { NextConfig } from "next";

/** Build a remotePattern from a full origin URL (e.g. NEXT_PUBLIC_API_URL). */
function patternFromUrl(raw: string | undefined) {
  if (!raw) return [];
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return [
      {
        protocol: (u.protocol === "http:" ? "http" : "https") as "http" | "https",
        hostname: u.hostname,
        ...(u.port ? { port: u.port } : {}),
        pathname: "/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // Tree-shake big barrel-export packages (icon sets, UI kits) so only the
  // components actually used are bundled — smaller JS, faster first load.
  experimental: {
    optimizePackageImports: ["@tabler/icons-react", "lucide-react"],
  },
  images: {
    // Serve modern formats; Next resizes to the requested display size.
    formats: ["image/avif", "image/webp"],
    // Hosts whose images we let the Next/Vercel optimizer fetch + resize:
    //  - the backend API origin (local-disk `/uploads/*`), from the build-time
    //    NEXT_PUBLIC_API_URL,
    //  - S3 buckets (admin uploads), and
    //  - an optional custom CDN via NEXT_PUBLIC_MEDIA_HOST.
    // Any other host falls back to `unoptimized` in <MediaImage> so it still
    // renders (just not resized) — never a broken image.
    remotePatterns: [
      ...patternFromUrl(process.env.NEXT_PUBLIC_API_URL),
      { protocol: "https", hostname: "**.amazonaws.com", pathname: "/**" },
      ...patternFromUrl(process.env.NEXT_PUBLIC_MEDIA_HOST),
    ],
  },
};

export default nextConfig;
