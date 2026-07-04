// The backend serves uploaded content images (logo, hero, gallery…) — allow
// next/image to optimize them. Host comes from the same env var the app uses.
const api = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800");

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
};

export default nextConfig;
