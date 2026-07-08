"use client";

import Image from "next/image";
import { useState } from "react";
import Icon from "@/components/Icon";
import type { GalleryView } from "@/lib/gallery";

export default function Gallery({
  items,
  categories,
}: {
  items: GalleryView[];
  categories: string[];
}) {
  const [filter, setFilter] = useState("all");
  const cats = ["all", ...categories];
  const shown = items.filter((g) => filter === "all" || g.category === filter);

  return (
    <section className="container" style={{ padding: "34px 22px 80px" }}>
      <div className="gallery-filters">
        {cats.map((c) => (
          <button key={c} type="button" className={filter === c ? "is-active" : ""} onClick={() => setFilter(c)}>
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>
      <div className="gallery-grid">
        {shown.map((it, i) => (
          <div
            key={`${it.title}-${i}`}
            className="gallery-item"
            style={{ background: it.tint ?? "#0c3b63" }}
          >
            {it.imageUrl ? (
              <Image
                src={it.imageUrl}
                alt={it.title}
                fill
                sizes="(max-width: 960px) 50vw, 33vw"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="ic">
                <Icon name={it.icon ?? "camera"} color="#ffffff" size={44} />
              </div>
            )}
            <div className="shade" />
            <div className="cap">
              <div className="l">{it.title}</div>
              <div className="c">{it.category}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
