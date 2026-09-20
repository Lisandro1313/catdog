"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { PhotoRow } from "@/lib/photos";

/** Tira de fotos: se desliza con el dedo en el celular, grilla en escritorio. Tocás una y se agranda (lightbox). */
export function PhotoStrip({ photos }: { photos: PhotoRow[] }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i == null ? i : Math.min(photos.length - 1, i + 1)));
      if (e.key === "ArrowLeft") setOpen((i) => (i == null ? i : Math.max(0, i - 1)));
    };
    addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    (document.querySelector(".lightbox-close") as HTMLElement | null)?.focus();
    return () => {
      removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, photos.length]);

  return (
    <>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-3 sm:hidden" style={{ scrollbarWidth: "none" }}>
        {photos.map((p, i) => (
          <figure key={p.id} className="w-[78vw] shrink-0 snap-center">
            <button type="button" className="relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border border-line" onClick={() => setOpen(i)} aria-label="Ver la foto grande">
              <Image src={p.url} alt={p.caption ?? ""} fill sizes="78vw" className="object-cover" />
            </button>
            {p.caption && <figcaption className="mt-2 text-center text-xs text-muted">{p.caption}</figcaption>}
          </figure>
        ))}
      </div>
      <div className="mx-auto hidden max-w-4xl grid-cols-3 gap-4 px-6 sm:grid">
        {photos.map((p, i) => {
          const big = i === 0 && photos.length >= 3;
          return (
            <figure key={p.id} className={big ? "row-span-2" : ""}>
              <button
                type="button"
                className={`relative block w-full overflow-hidden rounded-2xl border border-line transition hover:border-accent/60 ${big ? "h-full min-h-[24rem]" : "aspect-[4/3]"}`}
                onClick={() => setOpen(i)}
                aria-label="Ver la foto grande"
              >
                <Image src={p.url} alt={p.caption ?? ""} fill sizes="(min-width: 640px) 30vw, 100vw" className="object-cover" />
              </button>
              {p.caption && <figcaption className="mt-2 text-xs text-muted">{p.caption}</figcaption>}
            </figure>
          );
        })}
      </div>

      {open != null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Fotos" onClick={() => setOpen(null)}>
          <button type="button" className="lightbox-close" aria-label="Cerrar" onClick={() => setOpen(null)}>
            ×
          </button>
          <div
            className="lightbox-track"
            onClick={(e) => e.stopPropagation()}
            ref={(el) => {
              if (el) el.children[open]?.scrollIntoView({ inline: "center", block: "nearest" });
            }}
          >
            {photos.map((p) => (
              <figure key={p.id} className="lightbox-slide">
                <div className="relative h-full w-full">
                  <Image src={p.url} alt={p.caption ?? ""} fill sizes="100vw" className="object-contain" />
                </div>
                {p.caption && <figcaption className="mt-3 text-center text-sm text-muted">{p.caption}</figcaption>}
              </figure>
            ))}
          </div>
          <p className="lightbox-hint">
            {open + 1} / {photos.length} · deslizá
          </p>
        </div>
      )}
    </>
  );
}
