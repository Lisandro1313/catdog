/**
 * La parte de la sobremesa que también usa el teléfono: topes, tipos y limpieza de texto.
 * Va aparte de `foro.ts` porque aquel habla con la base y no puede viajar al navegador.
 */

export const MAX_TITULO = 90;
export const MAX_TEXTO = 1500;
export const MAX_NOMBRE = 40;

export type TemaRow = {
  id: string;
  title: string;
  text: string;
  author: string;
  fromHouse: boolean;
  pinned: boolean;
  createdAt: Date;
  lastAt: Date;
  respuestas: number;
  mio: boolean;
  eventTitle: string | null;
};

export type RespuestaRow = {
  id: string;
  text: string;
  author: string;
  fromHouse: boolean;
  createdAt: Date;
  mio: boolean;
};

/** Un nombre presentable: sin espacios de más, sin saltos de línea y con un largo razonable. */
export function limpiarNombre(raw: string): string {
  return raw.replace(/\s+/gu, " ").trim().slice(0, MAX_NOMBRE);
}

/** El texto tal cual lo escribieron, pero sin saltos de línea de más ni espacios al final. */
export function limpiarTexto(raw: string, max: number): string {
  return raw.replace(/\r\n/gu, "\n").replace(/\n{3,}/gu, "\n\n").trim().slice(0, max);
}
