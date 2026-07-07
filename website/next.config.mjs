// The backend serves uploaded content images (logo, hero, gallery…) — allow
// next/image to optimize them. Host comes from the same env var the app uses.
const api = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800");
const apiOrigin = api.origin;
const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy + companion security headers.
 *
 * Approach: a static, tightly-allowlisted CSP applied at the edge via
 * `headers()`. We deliberately avoid a per-request nonce because that would
 * force every page into dynamic rendering and defeat the site's ISR/SSG (and
 * its LCP/SEO). Instead we allowlist the exact third-party hosts in use:
 *   - Google Analytics 4 / Tag Manager
 *   - Microsoft Clarity
 *   - Google Maps embed (contact page iframe)
 *   - the backend API origin (uploaded media / API calls)
 *
 * `'unsafe-inline'` on script-src is required because GA4's config snippet,
 * Clarity's loader, and the JSON-LD block are inline (and the JSON-LD is
 * CMS-driven, so it can't be hashed). In development we also allow
 * `'unsafe-eval'` + websockets so Next's HMR / React Refresh keep working.
 */
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  "https://www.googletagmanager.com",
  "https://www.clarity.ms",
  "https://*.clarity.ms",
];
const connectSrc = [
  "'self'",
  "https://www.googletagmanager.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
  "https://*.clarity.ms",
  "https://c.bing.com",
  apiOrigin,
];
if (!isProd) {
  scriptSrc.push("'unsafe-eval'"); // Next.js dev HMR / React Refresh
  connectSrc.push("ws:", "http://localhost:*"); // dev HMR websocket
}

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src ${scriptSrc.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://www.googletagmanager.com https://*.google-analytics.com https://*.clarity.ms ${apiOrigin}`,
  "font-src 'self' data:",
  `connect-src ${connectSrc.join(" ")}`,
  "frame-src 'self' https://www.google.com https://maps.google.com",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // HSTS is only honoured over HTTPS (ignored on local http), so it's safe to
  // always send; it hardens the production domain.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: api.protocol.replace(":", ""),
        hostname: api.hostname,
        port: api.port || "",
        pathname: "/api/files/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
