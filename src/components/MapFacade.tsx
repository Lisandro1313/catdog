"use client";

import { useEffect, useRef, useState } from "react";

/**
 * El mapa de Google pesa ~450 KB de JavaScript. En vez de cargarlo con la página,
 * mostramos un recuadro liviano y montamos el iframe recién cuando la sección se acerca
 * a la pantalla (o si tocan "Ver el mapa").
 */
export function MapFacade({ center, zoom = 16, title }: { center: string; zoom?: number; title: string }) {
  const [load, setLoad] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || load) return;
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [load]);

  const src = `https://maps.google.com/maps?ll=${center}&z=${zoom}&t=m&output=embed`;

  return (
    <div ref={ref} className="relative h-56 w-full overflow-hidden rounded-2xl border border-line bg-surface-2 sm:h-64">
      {load ? (
        <iframe
          title={title}
          src={src}
          className="h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ filter: "grayscale(1) invert(0.92) contrast(0.9) brightness(0.9)" }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoad(true)}
          className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-muted hover:text-ink"
          aria-label="Cargar el mapa"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          Ver el mapa de la zona
        </button>
      )}
    </div>
  );
}
