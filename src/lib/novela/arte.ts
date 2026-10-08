/**
 * Las ilustraciones (webp) que existen en `public/novela/`. Lista explícita para no pedir nunca una
 * imagen que no está (nada de 404). Si falta una expresión, se usa la `normal` del personaje con un
 * efecto encima; si no hay ninguna del personaje, se dibuja el retrato en SVG.
 *
 * Para sumar una ilustración: copiarla a `public/novela/` con el nombre `<personaje>-<cara>.webp`
 * (las caras son las de `CARAS` en tipos.ts) o `fondo-<lugar>.webp`, y agregarla acá.
 */
import type { Cara, CgId, Fondo, Quien } from "./tipos";

const RETRATOS = new Set<string>([
  "vera-normal",
  "teo-normal",
  "mora-normal",
  "gervasio-normal",
  "gervasio-sonrisa",
  "dante-normal",
  "sol-normal",
  "luna-normal",
  "bruno-normal",
  "cami-normal",
  "evelyn-normal",
]);

/** Vestuario de salir (escenas con `noche`): una sola imagen por personaje, sirve para cualquier cara. */
const CITA = new Set<string>(["vera", "teo", "mora", "dante", "sol"]);

/** Escenas ilustradas que tienen imagen (si no, se compone en SVG). */
const CG_IMG: Partial<Record<CgId, string>> = {
  "cg-beso": "cg-beso",
  "cg-vera-barra": "cg-vera-barra",
  "cg-sol-techo": "cg-sol-techo",
  "cg-mora": "cg-mora-pool",
  "cg-fiesta": "cg-luna-cabina",
};

const FONDOS_IMG: Partial<Record<Fondo, string>> = {
  puerta: "fondo-puerta",
  barra: "fondo-barra",
  pool: "fondo-pool",
  cocina: "fondo-cocina",
  vereda: "fondo-diagonal",
  diagonal: "fondo-diagonal",
  plaza: "fondo-plaza",
};

const BASE = "/novela/";

/** El nombre de archivo del personaje (el del abrigo es Gervasio, aunque todavía no se sepa). */
const ARCHIVO: Partial<Record<Quien, string>> = {
  vera: "vera",
  teo: "teo",
  mora: "mora",
  gris: "gervasio",
  gervasio: "gervasio",
  dante: "dante",
  sol: "sol",
  amalia: "amalia",
  luna: "luna",
  bruno: "bruno",
  cami: "cami",
  evelyn: "evelyn",
};

/**
 * La imagen para un personaje y una cara. `exacta` dice si la expresión existe tal cual o si se cae
 * en la normal (y entonces la emoción se acompaña con efectos).
 */
export function imagenRetrato(quien: Quien, cara: Cara, noche = false): { src: string; exacta: boolean } | null {
  const a = ARCHIVO[quien];
  if (!a) return null;
  if (noche && CITA.has(a)) return { src: `${BASE}${a}-cita.webp`, exacta: cara === "normal" };
  if (RETRATOS.has(`${a}-${cara}`)) return { src: `${BASE}${a}-${cara}.webp`, exacta: true };
  if (RETRATOS.has(`${a}-normal`)) return { src: `${BASE}${a}-normal.webp`, exacta: cara === "normal" };
  return null;
}

export function imagenFondo(f: Fondo): string | null {
  const a = FONDOS_IMG[f];
  return a ? `${BASE}${a}.webp` : null;
}

export function imagenCg(id: CgId): string | null {
  const a = CG_IMG[id];
  return a ? `${BASE}${a}.webp` : null;
}

/** Para precargar: todas las imágenes de un personaje que existen (con la de cita, si se pide). */
export function imagenesDe(quien: Quien, noche = false): string[] {
  const a = ARCHIVO[quien];
  if (!a) return [];
  const out = [...RETRATOS].filter((r) => r.startsWith(`${a}-`)).map((r) => `${BASE}${r}.webp`);
  if (noche && CITA.has(a)) out.push(`${BASE}${a}-cita.webp`);
  return out;
}
