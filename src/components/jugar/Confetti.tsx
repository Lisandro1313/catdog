"use client";

import { useEffect } from "react";
import type { Options } from "canvas-confetti";

/** Los colores de la casa: dorado, crema y rojo vino. */
const COLORES = ["#d8b878", "#e0c283", "#c9a96e", "#f3ede4", "#fff8ea", "#7b2233", "#9e3a3a"];

type Lanzar = (o?: Options) => Promise<undefined> | null;
let cargado: Promise<Lanzar | null> | null = null;

/** canvas-confetti se baja recién la primera vez que hay algo que festejar. */
function confetti(): Promise<Lanzar | null> {
  cargado ??= import("canvas-confetti").then((m) => m.default as Lanzar).catch(() => null);
  return cargado;
}

const base: Options = {
  colors: COLORES,
  disableForReducedMotion: true,
  ticks: 220,
  gravity: 1.05,
  scalar: 0.95,
  zIndex: 30,
};

/**
 * Tira papelitos dorados. `n` es más o menos cuántos (como el viejo `count`): con pocos es un
 * estallido chico desde el centro; con muchos, dos cañones desde los costados y una lluvia corta.
 * Devuelve una función para cortar la lluvia (lo que ya está en el aire termina de caer).
 */
export function festejar(n = 36, opciones: { y?: number } = {}): () => void {
  if (n <= 0 || typeof window === "undefined") return () => {};
  let vivo = true;
  const timers: ReturnType<typeof setTimeout>[] = [];
  void confetti().then((tirar) => {
    if (!tirar || !vivo) return;
    const y = opciones.y ?? 0.62;
    if (n < 40) {
      void tirar({ ...base, particleCount: Math.round(n * 1.6), spread: 70, startVelocity: 38, origin: { x: 0.5, y } });
      return;
    }
    // Dos cañones que se cruzan, y después un par de ráfagas más chicas.
    const canon = (x: number, angulo: number, cuantos: number) =>
      void tirar({ ...base, particleCount: cuantos, angle: angulo, spread: 58, startVelocity: 55, origin: { x, y: 0.85 } });
    canon(0.05, 62, Math.round(n * 0.8));
    canon(0.95, 118, Math.round(n * 0.8));
    const rafagas = Math.min(4, Math.floor(n / 30));
    for (let k = 1; k <= rafagas; k++) {
      timers.push(
        setTimeout(() => {
          if (!vivo) return;
          void tirar({ ...base, particleCount: Math.round(n * 0.35), spread: 100, startVelocity: 30, origin: { x: 0.2 + Math.random() * 0.6, y: 0.1 + Math.random() * 0.2 } });
        }, k * 280),
      );
    }
  });
  return () => {
    vivo = false;
    timers.forEach(clearTimeout);
  };
}

/**
 * Lluvia de papelitos al montarse (canvas-confetti). Misma API que antes: `count` dice cuántos
 * (0, nada). `demora` (ms) espera antes de tirar, para que coincida con lo que se anima.
 * No dibuja nada en React: canvas-confetti pone su propio lienzo encima y lo saca al terminar.
 */
export function Confetti({ count = 36, demora = 0 }: { count?: number; demora?: number }) {
  useEffect(() => {
    if (count <= 0) return;
    let cortar: (() => void) | null = null;
    const id = setTimeout(() => {
      cortar = festejar(count);
    }, demora);
    return () => {
      clearTimeout(id);
      cortar?.();
    };
  }, [count, demora]);
  return null;
}
