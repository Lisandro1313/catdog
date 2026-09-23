"use client";

import { flushSync } from "react-dom";
import { useEffect, useState } from "react";

/** Marco común de cada juego: volver + título arriba, el juego abajo. */
export function Shell({ title, onBack, children, right }: { title: string; onBack: () => void; children?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="jg-stage">
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <button type="button" className="-m-2 inline-flex min-h-11 items-center p-2 hover:text-ink" onClick={onBack}>
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

type Sentinel = { release: () => Promise<void> };
type WakeNav = Navigator & { wakeLock?: { request: (t: "screen") => Promise<Sentinel> } };
let sentinel: Sentinel | null = null;
let wanted = false;

/** Que la pantalla no se apague en el medio de una partida (Wake Lock; si el navegador no lo tiene, no pasa nada). */
export function keepAwake() {
  wanted = true;
  request();
}

function request() {
  try {
    if (sentinel || typeof document === "undefined" || document.hidden) return;
    void (navigator as WakeNav).wakeLock
      ?.request("screen")
      .then((s) => {
        sentinel = s;
      })
      .catch(() => {});
  } catch {
    // sin wake lock
  }
}

/** Al salir del juego: la pantalla vuelve a apagarse sola. */
export function letSleep() {
  wanted = false;
  const s = sentinel;
  sentinel = null;
  void s?.release().catch(() => {});
}

// El navegador suelta el lock al irse a segundo plano: al volver, si seguíamos jugando, se pide de nuevo.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) sentinel = null;
    else if (wanted) request();
  });
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

/** Vibración corta (si el celu puede). Sin sonido: sirve para acompañar un acierto. */
export function tap(ms = 10) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // sin vibración
  }
}

export function buzz() {
  beep(110, 320, "sawtooth", 0.12);
  tap(45);
}
