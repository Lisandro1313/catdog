"use client";

import { beep } from "./Shell";

/**
 * Sonidos y gestos chicos que comparten Atrapá al chef, la copa, Simón, mímica, trivia y el impostor.
 * Todo pasa por beep() de Shell, así que respeta el botón de silencio.
 */

/** Varias notas seguidas (un arpegio). */
export function chime(notes: number[], gap = 85, ms = 150, type: OscillatorType = "sine", volume?: number) {
  notes.forEach((f, k) => {
    if (k === 0) beep(f, ms, type, volume);
    else setTimeout(() => beep(f, ms, type, volume), k * gap);
  });
}

/** Acierto que sube de tono con la racha (tope para que no chille). */
export function hitTone(streak: number) {
  beep(520 + Math.min(streak, 12) * 45, 90, "triangle", 0.16);
}

/** Tic del reloj en los últimos segundos. */
export function tick(urgent = false) {
  beep(urgent ? 1180 : 940, 45, "square", 0.05);
}

/** Error suave (no tan áspero como buzz): para pasar una carta o un toque al aire. */
export function thud() {
  beep(180, 120, "triangle", 0.12);
}

export const FANFARRIA = [523, 659, 784, 1047];

/** Vibración con patrón (si el celu puede). */
export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // sin vibración
  }
}
