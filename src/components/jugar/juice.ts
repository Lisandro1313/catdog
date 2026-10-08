"use client";

import { beep, precargarSonidos, sonar, type Sonido } from "./Shell";

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
  sonar("tic", urgent ? 0.5 : 0.35, urgent ? 1.2 : 1);
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

/**
 * Fanfarrias grabadas (Kenney "Jingles", CC0) para los momentos grandes. Van bajitas y después del
 * sonido propio del juego, para no taparlo: el saxo tiene algo de bar; el pizzicato es cortito.
 */
const FANFARRIAS = {
  /** Llegaste a la meta del juego. */
  meta: { s: "jingle-sax-03", vol: 0.42, dura: 1200 },
  /** Mejoraste tu marca personal. */
  record: { s: "jingle-pizzi-07", vol: 0.38, dura: 1400 },
  /** Te ganaste el trago: el más largo del saxo. */
  trago: { s: "jingle-sax-07", vol: 0.5, dura: 1800 },
  /** Terminó sin meta: un guiño corto y amable. */
  fin: { s: "jingle-pizzi-16", vol: 0.2, dura: 520 },
  /** Ganó alguien un duelo o un torneo. */
  ganador: { s: "jingle-sax-12", vol: 0.45, dura: 950 },
} as const satisfies Record<string, { s: Sonido; vol: number; dura: number }>;

export type Fanfarria = keyof typeof FANFARRIAS;

/** Que estén listas antes de que haga falta (el primer festejo no llega tarde). */
export function precargarFanfarrias(lista: Fanfarria[] = ["meta", "record", "fin"]) {
  precargarSonidos(lista.map((k) => FANFARRIAS[k].s));
}

/** Cuánto dura una fanfarria (ms), para encadenar otra sin pisarla. */
export function duraFanfarria(tipo: Fanfarria): number {
  return FANFARRIAS[tipo].dura;
}

/** Suena una fanfarria (respeta el silencio, como todo lo que pasa por `sonar`). */
export function fanfarria(tipo: Fanfarria) {
  const f = FANFARRIAS[tipo];
  sonar(f.s, f.vol);
}
