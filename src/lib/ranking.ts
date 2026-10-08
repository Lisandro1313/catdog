import { GAMES, LOWER_IS_BETTER, type GameId, type RecordRow, type Records } from "./juegos";

/**
 * El ranking de la semana (lunes a domingo, días argentinos). Lo puro: qué semana es y quién va
 * primero. La consulta a la base está en premios.ts.
 */

const DIA_MS = 86_400_000;

function aMs(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}
function aDia(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** La semana (lunes a domingo) en la que cae un día "2026-10-08". */
export function semanaDe(day: string): { desde: string; hasta: string } {
  const ms = aMs(day);
  // getUTCDay: 0 = domingo. Lunes = 0.
  const dow = (new Date(ms).getUTCDay() + 6) % 7;
  const lunes = ms - dow * DIA_MS;
  return { desde: aDia(lunes), hasta: aDia(lunes + 6 * DIA_MS) };
}

/** La semana anterior a la de ese día. */
export function semanaAnterior(day: string): { desde: string; hasta: string } {
  return semanaDe(aDia(aMs(semanaDe(day).desde) - DIA_MS));
}

export type FilaPuntaje = { game: string; deviceKey: string; name: string | null; best: number; updatedAt: Date };

/**
 * Top por juego a partir de las marcas de la semana: solo con nombre, una fila por teléfono (su
 * mejor marca de la semana), en el orden del juego (en memoria y la palabra gana el más bajo). A
 * igual marca, va primero el que la hizo antes.
 */
export function rankingPorJuego(filas: FilaPuntaje[], top = 5): Records {
  const out = {} as Records;
  for (const g of GAMES) out[g] = topDe(g, filas, top);
  return out;
}

export function topDe(game: GameId, filas: FilaPuntaje[], top = 5): RecordRow[] {
  const menor = LOWER_IS_BETTER[game];
  const ordenadas = filas
    .filter((f) => f.game === game && f.name)
    .sort((a, b) => (a.best !== b.best ? (menor ? a.best - b.best : b.best - a.best) : a.updatedAt.getTime() - b.updatedAt.getTime()));
  const vistos = new Set<string>();
  const res: RecordRow[] = [];
  for (const f of ordenadas) {
    if (vistos.has(f.deviceKey)) continue;
    vistos.add(f.deviceKey);
    res.push({ name: f.name ?? "", best: f.best });
    if (res.length >= top) break;
  }
  return res;
}

/** "6 al 12 de octubre" para mostrar la semana. */
export function nombreSemana({ desde, hasta }: { desde: string; hasta: string }): string {
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const [, m1, d1] = desde.split("-").map(Number);
  const [, m2, d2] = hasta.split("-").map(Number);
  return m1 === m2 ? `${d1} al ${d2} de ${MESES[m2 - 1]}` : `${d1} de ${MESES[m1 - 1]} al ${d2} de ${MESES[m2 - 1]}`;
}
