/**
 * Sacudir el teléfono como un cubilete.
 *
 * Lee la aceleración (con la gravedad incluida, que es lo que dan todos los teléfonos) y decide
 * cuándo alguien está sacudiendo y cuándo paró. Los dados se tiran al parar, como con un cubilete
 * de verdad: se sacude, se frena y caen.
 *
 * No alcanza con un pico: dejar el teléfono sobre la mesa de un golpe también da un pico. Hace falta
 * un par de sacudones seguidos para arrancar, y un rato quieto para soltar.
 */

/** Cuánto tiene que cambiar la aceleración de una lectura a la otra para contar como sacudón (m/s²). */
export const UMBRAL = 14;
/** Cuántos sacudones seguidos hacen falta para arrancar. */
export const SACUDONES_PARA_ARRANCAR = 4;
/** Ventana en la que tienen que caer esos sacudones (ms). */
export const VENTANA_MS = 700;
/** Cuánto tiempo quieto hace falta para que cuente como que paró (ms). */
export const QUIETO_MS = 320;

export type Lectura = { x: number; y: number; z: number; t: number };
export type Evento = "empezo" | "paro" | null;

export type Detector = {
  /** Pasa una lectura; devuelve si empezó a sacudir, si paró, o nada. */
  leer: (l: Lectura) => Evento;
  /** Si en este momento está sacudiendo. */
  sacudiendo: () => boolean;
  /** Si pasó el tiempo quieto (para llamar con un reloj aparte cuando el sensor deja de mandar). */
  revisar: (t: number) => Evento;
};

export function crearDetector(): Detector {
  let anterior: Lectura | null = null;
  let picos: number[] = [];
  let activo = false;
  let ultimoPico = 0;

  const revisar = (t: number): Evento => {
    if (activo && t - ultimoPico >= QUIETO_MS) {
      activo = false;
      picos = [];
      return "paro";
    }
    return null;
  };

  return {
    sacudiendo: () => activo,
    revisar,
    leer(l) {
      const a = anterior;
      anterior = l;
      if (!a) return null;
      const cambio = Math.abs(l.x - a.x) + Math.abs(l.y - a.y) + Math.abs(l.z - a.z);
      if (cambio >= UMBRAL) {
        ultimoPico = l.t;
        picos = [...picos.filter((p) => l.t - p <= VENTANA_MS), l.t];
        if (!activo && picos.length >= SACUDONES_PARA_ARRANCAR) {
          activo = true;
          return "empezo";
        }
        return null;
      }
      return revisar(l.t);
    },
  };
}
