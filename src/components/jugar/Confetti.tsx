"use client";

import { useEffect } from "react";
import type { Options, Shape } from "canvas-confetti";
import { urlEmoji } from "@/lib/emoji-3d";

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

/** El módulo entero (para shapeFromText), además de la función de tirar. */
type Modulo = Lanzar & { shapeFromText?: (o: { text: string; scalar?: number }) => Shape };
let modulo: Promise<Modulo | null> | null = null;
function moduloConfetti(): Promise<Modulo | null> {
  modulo ??= import("canvas-confetti").then((m) => m.default as Modulo).catch(() => null);
  return modulo;
}

/** El tamaño de los emojis que vuelan: más grandes que un papelito, para que se reconozcan. */
const ESCALA_EMOJI = 2.6;
/** Lado en píxeles de la imagen del emoji: con 96 se ve nítido en las pantallas de 3x. */
const LADO = 96;
const formas = new Map<string, Promise<Shape | null>>();

/**
 * Un emoji como papelito. Si está en 3D (los mismos de los juegos), vuela el dibujo 3D; si no, el
 * del teléfono. canvas-confetti mide sus formas en "10 px a escala 1": la matriz lleva la imagen a eso.
 */
function formaDe(e: string): Promise<Shape | null> {
  let p = formas.get(e);
  if (!p) {
    p = (async () => {
      const src = urlEmoji(e);
      if (src && typeof createImageBitmap === "function") {
        try {
          const blob = await (await fetch(src)).blob();
          const bitmap = await createImageBitmap(blob, { resizeWidth: LADO, resizeHeight: LADO, resizeQuality: "high" });
          const s = 10 / LADO;
          return { type: "bitmap", bitmap, matrix: [s, 0, 0, s, (-LADO * s) / 2, (-LADO * s) / 2] as unknown as DOMMatrix } as Shape;
        } catch {
          // sigue con el del teléfono
        }
      }
      const m = await moduloConfetti();
      return m?.shapeFromText ? m.shapeFromText({ text: e, scalar: ESCALA_EMOJI }) : null;
    })();
    formas.set(e, p);
  }
  return p;
}

/**
 * Tira papelitos dorados. `n` es más o menos cuántos (como el viejo `count`): con pocos es un
 * estallido chico desde el centro; con muchos, dos cañones desde los costados y una lluvia corta.
 * Devuelve una función para cortar la lluvia (lo que ya está en el aire termina de caer).
 */
export function festejar(n = 36, opciones: { y?: number; emojis?: string[] } = {}): () => void {
  if (n <= 0 || typeof window === "undefined") return () => {};
  let vivo = true;
  const timers: ReturnType<typeof setTimeout>[] = [];
  // Los emojis del juego vuelan junto con los papelitos: limones en la fruta, dados en la Generala.
  if (opciones.emojis?.length) {
    void Promise.all([confetti(), ...opciones.emojis.map(formaDe)]).then(([tirar, ...shapes]) => {
      const validas = shapes.filter((s): s is Shape => Boolean(s));
      if (!tirar || !vivo || validas.length === 0) return;
      void (tirar as Lanzar)({
        ...base,
        shapes: validas,
        scalar: ESCALA_EMOJI,
        particleCount: Math.max(8, Math.round(n * 0.35)),
        spread: 95,
        startVelocity: 42,
        gravity: 0.9,
        ticks: 260,
        origin: { x: 0.5, y: opciones.y ?? 0.62 },
      });
    });
  }
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
export function Confetti({ count = 36, demora = 0, emojis }: { count?: number; demora?: number; emojis?: string[] }) {
  const cuales = emojis?.join(" ") ?? "";
  useEffect(() => {
    if (count <= 0) return;
    let cortar: (() => void) | null = null;
    const id = setTimeout(() => {
      cortar = festejar(count, { emojis: cuales ? cuales.split(" ") : undefined });
    }, demora);
    return () => {
      clearTimeout(id);
      cortar?.();
    };
  }, [count, demora, cuales]);
  return null;
}
