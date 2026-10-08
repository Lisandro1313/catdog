import type { Escena, FinalId, Fondo, TemaNovela } from "./tipos";

/**
 * Qué música suena en cada parte de la novela. Sin datos nuevos en el guion: se decide por la
 * escena (id, final, rango, fondo) y, si hace falta forzar algo, con `musica` en la escena.
 *
 * - barra: la casa, el día a día.            - noche: tensión, cierres de noche, el apagón.
 * - misterio: servilleta, Gervasio, el 87.    - melancolia: lo triste, las confesiones.
 * - jazz-suave: citas, romance, mañanas.      - brass: fiesta, entrenar, la casa llena.
 */

/** Escenas puntuales (se testea que existan todas). */
export const MUSICA_ESCENA: Record<string, TemaNovela> = {
  // El misterio: la servilleta, el cuaderno, Gervasio, el 87, el tablero.
  "s1-lun": "misterio",
  "s1-jue-cierre": "misterio",
  "s1-vie-cuaderno": "misterio",
  "s1-sab-cierre": "misterio",
  "s1-sab-calco": "misterio",
  "s2-jue-cierre": "misterio",
  "s2-sab-cierre": "misterio",
  "s3-lun": "misterio",
  "s3-vie": "misterio",
  "s4-lun": "misterio",
  "s4-lun-b": "misterio",
  "s4-lun-c": "misterio",
  "s4-sab": "misterio",
  "s4-sab-b": "misterio",
  "s5-lun-cierre": "misterio",
  "s5-jue-b": "misterio",
  "s5-vie-medio": "misterio",
  "s5-acusacion": "misterio",
  "f-verdadero": "misterio",
  "sol-r9": "misterio",
  "sol-r9-b": "misterio",
  "cami-r7": "misterio",
  "vera-sombra": "misterio",
  "teo-sombra": "misterio",
  "mora-sombra": "misterio",
  "cami-sombra": "misterio",
  // Lo que duele.
  "s1-lun-cierre": "melancolia",
  "s3-jue-expuesto": "melancolia",
  "mora-r5": "melancolia",
  "cami-r5-b": "melancolia",
  "acu-bien-vera": "melancolia",
  "acu-bien-teo": "melancolia",
  "acu-bien-mora": "melancolia",
  "acu-bien-cami": "melancolia",
  "s5-madrugada-mal": "melancolia",
  "s5-sab": "melancolia",
  "s5-sab-final": "melancolia",
  "f-verdadero-b": "melancolia",
  // Tensión.
  celos: "noche",
  "s4-lun-duelo": "noche",
  "s3-jue-apagon": "noche",
  "s4-jue": "noche",
  "s5-madrugada": "noche",
  // Fiesta.
  "jun-s2-lun": "brass",
  "s3-sab-luna": "brass",
  "s5-vie": "brass",
  // El epílogo bueno de verdad.
  "f-verdadero-c": "jazz-suave",
};

const POR_FONDO: Partial<Record<Fondo, TemaNovela>> = {
  velas: "noche",
  oscuro: "misterio",
  bosque: "misterio",
  guardia: "noche",
  diagonal: "noche",
  terraza: "jazz-suave",
  depto: "jazz-suave",
  cabina: "brass",
};

/** El tema de cada final (el de la escena que lo cierra y el de la pantalla de "Fin"). */
export function temaDeFinal(f: FinalId): TemaNovela {
  if (f === "abrigo" || f === "cerrado" || f === "silla" || f === "engano") return "melancolia";
  if (f === "celos") return "noche";
  if (f === "casa") return "brass";
  return "jazz-suave";
}

/** Si el final es de los tristes (sin papel picado). */
export const finalTriste = (f: FinalId) => temaDeFinal(f) === "melancolia" || f === "celos";

export function temaDeEscena(e: Escena): TemaNovela {
  if (e.musica) return e.musica;
  const fijo = MUSICA_ESCENA[e.id];
  if (fijo) return fijo;
  if (e.fin) return temaDeFinal(e.fin);
  if (e.id.endsWith("-manana")) return "jazz-suave";
  if (e.id.startsWith("ent-")) return "brass";
  // Los rangos altos son los de las confesiones y el romance.
  if (e.rango && e.rango.n >= 6) return "jazz-suave";
  const f = POR_FONDO[e.fondo];
  if (f) return f;
  if (e.id.endsWith("-cierre")) return "noche";
  return "barra";
}

/** Volumen de cada tema (bajo: que no tape el texto). El brass es más fuerte de por sí. */
export const VOLUMEN_TEMA: Record<TemaNovela, number> = {
  barra: 0.32,
  noche: 0.34,
  melancolia: 0.38,
  "jazz-suave": 0.34,
  brass: 0.26,
  misterio: 0.36,
};
