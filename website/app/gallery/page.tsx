import type { Metadata } from "next";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import Gallery from "@/components/Gallery";
import JsonLd from "@/components/JsonLd";
import { fetchGallery } from "@/lib/gallery";

export const metadata: Metadata = pageMetadata({
  title: "Gallery — Aqua Lagoon",
  description: "A peek into life at Aqua Lagoon — splashes, smiles and celebrations.",
  path: "/gallery",
});

export default async function GalleryPage() {
  const { items, categories } = await fetchGallery();

  return (
    <div className="route-enter">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Gallery", path: "/gallery" }])} />
      <div className="page-hero center bg-radial-center">
        <div className="container">
          <span className="eyebrow">Moments</span>
          <h1>Gallery</h1>
          <p>A peek into life at Aqua Lagoon — splashes, smiles and celebrations.</p>
        </div>
      </div>
      <Gallery items={items} categories={categories} />
    </div>
  );
}
