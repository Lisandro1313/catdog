"use client";

import { flushSync } from "react-dom";
import { useEffect, useState } from "react";

/** Marco común de cada juego: volver + título arriba, el juego abajo. */
export function Shell({ title, onBack, children, right }: { title: string; onBack: () => void; children?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="jg-stage">
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <button type="button" className="hover:text-ink" onClick={onBack}>
          ← Juegos
        </button>
        <span className="truncate tracking-[0.2em] uppercase">{title}</span>
        <span className="flex min-w-[3rem] items-center justify-end gap-2 tabular-nums">
          {right}
          <MuteButton />
        </span>
      </div>
      {children}
    </div>
  );
}

const MUTE_KEY = "catdog:jugar:mudo";
let muted = false;

/** Silencio para la mesa: se recuerda en el teléfono y lo respetan todos los sonidos de los juegos. */
export function MuteButton() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        muted = localStorage.getItem(MUTE_KEY) === "1";
      } catch {
        // sin memoria
      }
      setOn(muted);
    }, 0);
    return () => clearTimeout(id);
  }, []);
  function toggle() {
    muted = !muted;
    setOn(muted);
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      // sin memoria
    }
    if (!muted) beep(660, 80);
  }
  return (
    <button type="button" onClick={toggle} className="text-base leading-none" aria-label={on ? "Activar sonido" : "Silenciar"} title={on ? "Con sonido" : "Silencio"}>
      {on ? "🔇" : "🔊"}
    </button>
  );
}

/** Que la pantalla no se apague en el medio de una partida (Wake Lock; si el navegador no lo tiene, no pasa nada). */
export function keepAwake() {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<unknown> } };
    void nav.wakeLock?.request("screen").catch(() => {});
  } catch {
    // sin wake lock
  }
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
  if (muted) return;
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
