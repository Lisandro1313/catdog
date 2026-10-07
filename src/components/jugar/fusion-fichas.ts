/**
 * El 2048 de la barra visto como fichas con nombre propio (id), para poder animarlas: cada ficha
 * sabe de dónde viene y a dónde va. Las reglas son las mismas que `mover` y `ponerFicha` de
 * juegos-reglas (los tests lo comparan): acá solo se agrega el seguimiento de cada ficha.
 */
import type { Direccion, Tablero } from "@/lib/juegos-reglas";

export type Ficha = {
  id: number;
  v: number;
  /** Fila y columna (0 a 3). */
  f: number;
  c: number;
  /** Recién puesta (aparece) o recién formada al juntar dos (pop). */
  nace?: "nueva" | "fusion";
  /** Se juntó con otra: se desliza a su lugar y desaparece. No cuenta para el tablero. */
  fuera?: boolean;
};

const LADO = 4;

export function aTablero(fichas: Ficha[]): Tablero {
  const t: Tablero = Array.from({ length: LADO }, () => Array<number>(LADO).fill(0));
  for (const x of fichas) if (!x.fuera) t[x.f][x.c] = x.v;
  return t;
}

export function desdeTablero(t: Tablero, nuevoId: () => number): Ficha[] {
  const out: Ficha[] = [];
  t.forEach((fila, f) => fila.forEach((v, c) => v && out.push({ id: nuevoId(), v, f, c })));
  return out;
}

/** Las celdas de una línea, desde el borde hacia el que se desliza. */
function linea(dir: Direccion, k: number): [number, number][] {
  return [0, 1, 2, 3].map((i) => {
    const p = dir === "izq" || dir === "arr" ? i : LADO - 1 - i;
    return dir === "izq" || dir === "der" ? [k, p] : [p, k];
  });
}

/**
 * Desliza todo para un lado. Cada ficha se junta una sola vez por jugada: las dos que se juntan se
 * deslizan al mismo lugar (y quedan `fuera`) y ahí nace una ficha nueva con el doble.
 */
export function deslizar(fichas: Ficha[], dir: Direccion, nuevoId: () => number): { fichas: Ficha[]; puntos: number; cambio: boolean; formadas: number[] } {
  const grid: (Ficha | null)[][] = Array.from({ length: LADO }, () => Array<Ficha | null>(LADO).fill(null));
  for (const x of fichas) if (!x.fuera) grid[x.f][x.c] = x;
  const out: Ficha[] = [];
  const formadas: number[] = [];
  let puntos = 0;
  let cambio = false;
  for (let k = 0; k < LADO; k++) {
    const celdas = linea(dir, k);
    let destino = 0;
    let ultima: Ficha | null = null;
    for (const [f, c] of celdas) {
      const x = grid[f][c];
      if (!x) continue;
      if (ultima && ultima.v === x.v) {
        const [df, dc] = celdas[destino - 1];
        ultima.fuera = true;
        out.push({ id: x.id, v: x.v, f: df, c: dc, fuera: true });
        const v = x.v * 2;
        out.push({ id: nuevoId(), v, f: df, c: dc, nace: "fusion" });
        puntos += v;
        formadas.push(v);
        cambio = true;
        ultima = null;
      } else {
        const [df, dc] = celdas[destino++];
        if (df !== f || dc !== c) cambio = true;
        const movida: Ficha = { id: x.id, v: x.v, f: df, c: dc };
        out.push(movida);
        ultima = movida;
      }
    }
  }
  return { fichas: out, puntos, cambio, formadas };
}

/** Pone una ficha nueva (90% hielo, 10% limón) en un lugar vacío, igual que `ponerFicha`. */
export function ponerNueva(fichas: Ficha[], azar: () => number, nuevoId: () => number): Ficha[] {
  const t = aTablero(fichas);
  const vacias: [number, number][] = [];
  t.forEach((fila, f) => fila.forEach((v, c) => v === 0 && vacias.push([f, c])));
  if (vacias.length === 0) return fichas;
  const [f, c] = vacias[Math.floor(azar() * vacias.length) % vacias.length];
  return [...fichas, { id: nuevoId(), v: azar() < 0.9 ? 2 : 4, f, c, nace: "nueva" }];
}
