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

/** Extract the origin (scheme://host:port) from a URL/host env value. */
function originOf(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).origin;
  } catch {
    return null;
  }
}

const isProd = process.env.NODE_ENV === "production";
const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_URL);
const mediaOrigin = originOf(process.env.NEXT_PUBLIC_MEDIA_HOST);

/**
 * Security headers for the admin app. The admin's browser talks directly to the
 * backend API (axios → NEXT_PUBLIC_API_URL) so that origin is allowlisted in
 * connect-src/img-src; images may also come from S3 or an optional CDN.
 * Static allowlist (no per-request nonce) so pages stay statically optimizable.
 * In development we allow 'unsafe-eval' + websockets for Next HMR/React Refresh.
 */
const scriptSrc = ["'self'", "'unsafe-inline'"];
const styleSrc = ["'self'", "'unsafe-inline'"];
const imgSrc = ["'self'", "data:", "blob:", "https://*.amazonaws.com", apiOrigin, mediaOrigin].filter(Boolean);
const connectSrc = ["'self'", apiOrigin, mediaOrigin].filter(Boolean);
if (!isProd) {
  scriptSrc.push("'unsafe-eval'");
  connectSrc.push("ws:", "http://localhost:*", "https://localhost:*");
}

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src ${scriptSrc.join(" ")}`,
  `style-src ${styleSrc.join(" ")}`,
  `img-src ${imgSrc.join(" ")}`,
  "font-src 'self' data:",
  `connect-src ${connectSrc.join(" ")}`,
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
