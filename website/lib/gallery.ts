import { API_URL, resolveMediaUrl } from "./env";
import { GALLERY } from "./data";

/**
 * A gallery tile for the public grid. Either a real uploaded photo (`imageUrl`)
 * or a placeholder rendered from an icon + gradient (`icon` + `tint`).
 */
export interface GalleryView {
  title: string;
  category: string;
  imageUrl?: string;
  icon?: string;
  tint?: string;
  ratio: string;
}

const RATIOS = ["4/3", "4/5", "4/3", "4/3", "4/5", "4/3"];

/** Placeholder tiles (the bundled design mockups) when the API has no images. */
function fallback(): { items: GalleryView[]; categories: string[] } {
  const items: GalleryView[] = GALLERY.map((g) => ({
    title: g.label,
    category: g.cat,
    icon: g.icon,
    tint: g.tint,
    ratio: g.ratio,
  }));
  const categories = Array.from(new Set(items.map((i) => i.category)));
  return { items, categories };
}

interface ApiGalleryImage {
  title: string;
  category: string;
  imageUrl: string;
}

/**
 * Fetches published gallery images from the backend (server-side, so no CORS
 * and the API can stay private). Revalidates every 60s. Falls back to the
 * bundled placeholders if the API is unreachable or empty.
 */
export async function fetchGallery(): Promise<{ items: GalleryView[]; categories: string[] }> {
  try {
    const res = await fetch(`${API_URL}/api/gallery`, { next: { revalidate: 3600 } });
    if (!res.ok) return fallback();

    const json = (await res.json()) as { data?: ApiGalleryImage[]; meta?: { categories?: string[] } };
    const rows = json.data ?? [];
    if (rows.length === 0) return fallback();

    const items: GalleryView[] = rows.map((r, i) => ({
      title: r.title,
      category: r.category,
      imageUrl: resolveMediaUrl(r.imageUrl),
      ratio: RATIOS[i % RATIOS.length],
    }));
    const categories =
      json.meta?.categories && json.meta.categories.length > 0
        ? json.meta.categories
        : Array.from(new Set(items.map((i) => i.category)));

    return { items, categories };
  } catch {
    return fallback();
  }
}
