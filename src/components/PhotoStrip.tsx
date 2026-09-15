import Image from "next/image";
import type { PhotoRow } from "@/lib/photos";

/** Tira de fotos: se desliza con el dedo en el celular, grilla en escritorio. */
export function PhotoStrip({ photos }: { photos: PhotoRow[] }) {
  return (
    <>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-3 sm:hidden" style={{ scrollbarWidth: "none" }}>
        {photos.map((p) => (
          <figure key={p.id} className="w-[78vw] shrink-0 snap-center">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-line">
              <Image src={p.url} alt={p.caption ?? ""} fill sizes="78vw" className="object-cover" />
            </div>
            {p.caption && <figcaption className="mt-2 text-center text-xs text-muted">{p.caption}</figcaption>}
          </figure>
        ))}
      </div>
      <div className="mx-auto hidden max-w-4xl grid-cols-3 gap-4 px-6 sm:grid">
        {photos.map((p, i) => {
          const big = i === 0 && photos.length >= 3;
          return (
            <figure key={p.id} className={big ? "row-span-2" : ""}>
              <div className={`relative w-full overflow-hidden rounded-2xl border border-line ${big ? "h-full min-h-[24rem]" : "aspect-[4/3]"}`}>
                <Image src={p.url} alt={p.caption ?? ""} fill sizes="(min-width: 640px) 30vw, 100vw" className="object-cover" />
              </div>
              {p.caption && <figcaption className="mt-2 text-xs text-muted">{p.caption}</figcaption>}
            </figure>
          );
        })}
      </div>
    </>
  );
}
