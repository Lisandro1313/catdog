import type { PhotoRow } from "@/lib/photos";

/** Tira de fotos: se desliza con el dedo en el celular, grilla en escritorio. */
export function PhotoStrip({ photos }: { photos: PhotoRow[] }) {
  return (
    <>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-3 sm:hidden" style={{ scrollbarWidth: "none" }}>
        {photos.map((p) => (
          <figure key={p.id} className="w-[78vw] shrink-0 snap-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.caption ?? ""} className="aspect-[4/5] w-full rounded-2xl border border-line object-cover" loading="lazy" />
            {p.caption && <figcaption className="mt-2 text-center text-xs text-muted">{p.caption}</figcaption>}
          </figure>
        ))}
      </div>
      <div className="mx-auto hidden max-w-4xl grid-cols-3 gap-4 px-6 sm:grid">
        {photos.map((p, i) => (
          <figure key={p.id} className={i === 0 && photos.length >= 3 ? "row-span-2" : ""}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={p.caption ?? ""}
              className={`w-full rounded-2xl border border-line object-cover ${i === 0 && photos.length >= 3 ? "h-full min-h-[24rem]" : "aspect-[4/3]"}`}
              loading="lazy"
            />
            {p.caption && <figcaption className="mt-2 text-xs text-muted">{p.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </>
  );
}
