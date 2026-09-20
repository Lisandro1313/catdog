"use client";

import { flushSync } from "react-dom";

/** Marco común de cada juego: volver + título arriba, el juego abajo. */
export function Shell({ title, onBack, children, right }: { title: string; onBack: () => void; children?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="jg-stage">
      <div className="flex items-center justify-between text-xs text-muted">
        <button type="button" className="hover:text-ink" onClick={onBack}>
          ← Juegos
        </button>
        <span className="tracking-[0.2em] uppercase">{title}</span>
        <span className="min-w-[3rem] text-right tabular-nums">{right}</span>
      </div>
      {children}
    </div>
  );
}

export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Cambia de pantalla con una transición suave (View Transitions API) donde el navegador la soporta;
 * si no, o con reduced-motion, cambia directo.
 */
export function withTransition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduced) {
    update();
    return;
  }
  doc.startViewTransition(() => {
    flushSync(update);
  });
}
