import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { getSiteContent } from "@/lib/site-content";

const STATIC_ROUTES = ["", "/services", "/classes", "/gallery", "/about", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { services } = await getSiteContent();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const serviceEntries: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${SITE_URL}/services/${s.id}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...serviceEntries];
}
