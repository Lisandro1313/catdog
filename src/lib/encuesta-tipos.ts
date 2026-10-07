/**
 * Las encuestas de la sobremesa.
 *
 * De cada diez personas que entran a un foro, nueve leen y no escriben nunca. No es timidez: es que
 * escribir cuesta y leer no. Una encuesta es la única forma de participar que no cuesta nada, y acá
 * sirve para lo que la casa ya pregunta en voz alta: qué poner de música, qué plato va en la carta.
 *
 * Esta parte no habla con la base, así que también puede viajar al navegador.
 */

export const MAX_PREGUNTA = 120;
export const MAX_OPCION = 60;
export const MIN_OPCIONES = 2;
export const MAX_OPCIONES = 6;

export type Opcion = {
  /** La posición: es lo que se guarda en el voto. */
  i: number;
  texto: string;
  votos: number;
  /** Redondeado, de 0 a 100. Sin votos, 0. */
  porcentaje: number;
  /** La votó este teléfono. */
  mia: boolean;
};

export type EncuestaVista = {
  id: string;
  pregunta: string;
  opciones: Opcion[];
  total: number;
  /** Ya votó este teléfono (y entonces se muestran los resultados). */
  vote: boolean;
};

/**
 * Los votos contados, en orden de opción.
 *
 * Los porcentajes se reparten sobre el total, y el redondeo puede dar 99 o 101: no se corrige,
 * porque emparejarlo a mano haría que una opción muestre un número que no es el suyo.
 */
export function contar(opciones: string[], votos: { opcion: number; deviceKey: string }[], miKey: string | null): EncuestaVista["opciones"] {
  const total = votos.length;
  return opciones.map((texto, i) => {
    const suyos = votos.filter((v) => v.opcion === i);
    return {
      i,
      texto,
      votos: suyos.length,
      porcentaje: total === 0 ? 0 : Math.round((suyos.length * 100) / total),
      mia: Boolean(miKey) && suyos.some((v) => v.deviceKey === miKey),
    };
  });
}

/** Las opciones tal como se escriben en el panel: una por línea. Sin vacías ni repetidas. */
export function parsearOpciones(raw: string): string[] {
  const vistas = new Set<string>();
  const out: string[] = [];
  for (const linea of raw.split("\n")) {
    const t = linea.replace(/\s+/gu, " ").trim().slice(0, MAX_OPCION);
    const clave = t.toLowerCase();
    if (!t || vistas.has(clave)) continue;
    vistas.add(clave);
    out.push(t);
    if (out.length === MAX_OPCIONES) break;
  }
  return out;
}

/** El texto del pie: "todavía nadie votó", "1 voto", "12 votos". */
export function textoDeVotos(total: number): string {
  if (total === 0) return "Todavía nadie votó";
  return total === 1 ? "1 voto" : `${total} votos`;
}
