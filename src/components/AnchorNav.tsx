"use client";

import { useEffect, useState } from "react";

type Item = { href: string; label: string };

/** Menú de anclas para escritorio: marca la sección que está a la vista. */
export function AnchorNav({ items, brand }: { items: Item[]; brand: string }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const targets = items.map((i) => document.getElementById(i.href.slice(1))).filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        // La sección visible más arriba gana.
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(`#${visible[0].target.id}`);
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav className="sticky top-0 z-20 hidden border-b border-line/60 bg-bg/85 backdrop-blur sm:block" aria-label="Secciones">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3 text-sm">
        <a href="#inicio" className="font-display text-lg tracking-wide">
          {brand}
        </a>
        <div className="flex items-center gap-7 text-muted">
          {items.map((i) => (
            <a key={i.href} href={i.href} className={`anchor-link ${active === i.href ? "is-active" : ""}`}>
              {i.label}
            </a>
          ))}
          <a href="#reservar" className="btn btn-primary btn-sm">
            Reservar
          </a>
        </div>
      </div>
    </nav>
  );
}
