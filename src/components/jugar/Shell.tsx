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
  if (document.visibilityState !== "visible") {
    update();
    return;
  }
  const t = doc.startViewTransition(() => {
    flushSync(update);
  }) as { finished?: Promise<void>; skipTransition?: () => void } | undefined;
  // Fusible: si la animación no termina (pestaña de fondo, navegador lento), se saltea y la pantalla queda usable.
  const timer = setTimeout(() => t?.skipTransition?.(), 500);
  t?.finished?.then(() => clearTimeout(timer)).catch(() => clearTimeout(timer));
}

let audio: AudioContext | null = null;

/** Tono corto con Web Audio (sin archivos). Se crea el contexto en el primer toque; si el navegador no deja, silencio. */
export function beep(freq: number, ms = 160, type: OscillatorType = "sine", volume = 0.18) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio ??= new Ctx();
    if (audio.state === "suspended") void audio.resume();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = volume;
    g.gain.setValueAtTime(volume, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + ms / 1000);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + ms / 1000);
  } catch {
    // sin audio
  }
}

export function buzz() {
  beep(110, 320, "sawtooth", 0.12);
}
