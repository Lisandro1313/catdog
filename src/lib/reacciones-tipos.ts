/**
 * Las reacciones de la sobremesa: la parte que también usa el teléfono.
 * Va aparte de `reacciones.ts` porque aquel habla con la base y no puede viajar al navegador.
 */

/**
 * Las cinco de la casa. Son pocas y fijas a propósito: con un teclado de emojis entero cada tema
 * junta veinte reacciones distintas de una sola persona y no se entiende nada. Con cinco, los
 * números significan algo.
 */
export const EMOJIS = ["👏", "🔥", "😂", "🤌", "🧉"] as const;
export type Emoji = (typeof EMOJIS)[number];

/** Qué quiere decir cada una, para el que no lo tiene claro y para el lector de pantalla. */
export const EMOJI_LABEL: Record<Emoji, string> = {
  "👏": "Aplausos",
  "🔥": "Buenísimo",
  "😂": "Me reí",
  "🤌": "Impecable",
  "🧉": "Me sumo",
};

export const SOBRE = ["tema", "respuesta"] as const;
export type Sobre = (typeof SOBRE)[number];

export function esEmoji(x: string): x is Emoji {
  return (EMOJIS as readonly string[]).includes(x);
}

export function esSobre(x: string): x is Sobre {
  return (SOBRE as readonly string[]).includes(x);
}

/** Lo que necesita el botón de cada emoji: cuántos van y si esta persona ya reaccionó. */
export type Conteo = { emoji: Emoji; cuantos: number; mia: boolean };

/**
 * Arma los conteos a partir de las filas sueltas de la base.
 * Devuelve sólo los emojis que alguien usó: una fila de cinco ceros debajo de cada mensaje es ruido.
 */
export function contar(filas: { emoji: string; deviceKey: string }[], miKey: string | null): Conteo[] {
  const out: Conteo[] = [];
  for (const emoji of EMOJIS) {
    const propias = filas.filter((f) => f.emoji === emoji);
    if (propias.length === 0) continue;
    out.push({ emoji, cuantos: propias.length, mia: Boolean(miKey) && propias.some((f) => f.deviceKey === miKey) });
  }
  return out;
}
