import type { Condicion, Stat } from "../tipos";

const NOMBRE_STAT: Record<Stat, string> = { encanto: "Encanto", coraje: "Coraje", labia: "Labia" };

/**
 * Lo que pide cada rango para estar disponible: los primeros tres, nada; después, avanzar en las
 * semanas y subir la cualidad que ese vínculo valora.
 */
export function puerta(n: number, stat: Stat): { pide?: Condicion; motivo?: string } {
  const semana = n <= 3 ? 0 : n <= 5 ? 3 : n <= 8 ? 4 : 5;
  const min = n === 6 ? 2 : n === 8 ? 3 : n === 10 ? 4 : 0;
  const conds: Condicion[] = [];
  const motivo: string[] = [];
  if (semana) {
    conds.push({ marca: `semana:${semana}` });
    motivo.push(`Desde la semana ${semana}`);
  }
  if (min) {
    conds.push({ stat, min });
    motivo.push(`${NOMBRE_STAT[stat]} ${min}`);
  }
  if (!conds.length) return {};
  return { pide: conds.length === 1 ? conds[0] : { todas: conds }, motivo: motivo.join(" · ") };
}
