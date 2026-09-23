import { prisma } from "./prisma";
import { parseMenu } from "./menu";
import { ROMAN, labelForStep } from "./pasos";

export { labelForStep };

/**
 * "Puertas adentro": el juego de las mesitas. Cada acto de la noche (recepción, pasos, postre)
 * esconde un ingrediente; el invitado apuesta cuando tiene el plato adelante y lo destapa ahí mismo.
 * Todo es opcional y uno solo puede jugarlo de punta a punta.
 */

const H = 60 * 60 * 1000;

/**
 * La cena "en vivo": publicada, desde 3 horas antes de la hora de la cena hasta 10 horas después
 * (así la madrugada sigue siendo esa noche, y nadie destapa los secretos reales a la mañana).
 */
export async function getTonightEvent() {
  const now = Date.now();
  return prisma.event.findFirst({
    where: { published: true, date: { gt: new Date(now - 10 * H), lte: new Date(now + 3 * H) } },
    orderBy: { date: "asc" },
    include: { steps: true },
  });
}

/** Para ver el juego cualquier día: la próxima cena publicada con carta, o la última publicada que tuvo. */
export async function getDemoEvent(eventId?: string | null) {
  if (eventId) {
    const e = await prisma.event.findUnique({ where: { id: eventId }, include: { steps: true } });
    if (e) return e;
  }
  const next = await prisma.event.findFirst({
    where: { published: true, unlisted: false, date: { gte: new Date() }, menu: { not: "" } },
    orderBy: { date: "asc" },
    include: { steps: true },
  });
  if (next && parseMenu(next.menu).length > 0) return next;
  return prisma.event.findFirst({
    where: { published: true, unlisted: false, date: { lt: new Date() }, menu: { not: "" } },
    orderBy: { date: "desc" },
    include: { steps: true },
  });
}

export async function isHoyOff(): Promise<boolean> {
  const s = await prisma.setting.findUnique({ where: { key: "hoy:off" } });
  return s?.value === "1";
}

export type Act = {
  index: number;
  /** "Acto I" */
  roman: string;
  /** "La antesala", "Primer paso"… */
  label: string;
  dish: string;
  drink: string | null;
  /** Por qué ese cóctel con ese plato (puede faltar). */
  why: string | null;
  /** Las cuatro fichas en orden alfabético (el orden no dice nada). Vacío si el acto no tiene secreto. */
  options: string[];
  /** Solo en el servidor: nunca se manda al teléfono antes de destapar. */
  secret: string | null;
};



/** Banco de ejemplo para ver el juego cuando una cena todavía no tiene secretos cargados. */
export const DEMO_BANK: { secret: string; decoys: string[]; why: string }[] = [
  { secret: "cardamomo", decoys: ["romero", "jengibre", "pomelo"], why: "Arranca la noche con algo fresco y sin alcohol: despierta el paladar sin cansarlo antes de la mesa." },
  { secret: "ajo negro", decoys: ["miso", "humo de romero", "anchoa"], why: "Un cóctel seco y burbujeante limpia la fritura y deja la boca lista para el segundo bocado." },
  { secret: "pimentón ahumado", decoys: ["curry", "comino", "nuez moscada"], why: "El amargo del cóctel corta la grasa y el humo del plato se cruza con el del vaso." },
  { secret: "cerveza negra", decoys: ["vino tinto", "café", "chocolate amargo"], why: "Un trago con cuerpo para un plato largo: acompaña, no compite." },
  { secret: "pimienta negra", decoys: ["aceto", "vainilla", "canela"], why: "Frutal y fresco para cerrar: el postre pide algo que no empalague." },
];



/**
 * Arma los actos de una cena a partir de la carta y los secretos cargados.
 * Con `demo`, los actos sin secreto usan el banco de ejemplo (para ver cómo queda).
 */
export function buildActs(
  event: { id: string; menu: string | null; welcomeDrink: string | null; steps: { index: number; secret: string | null; decoys: string | null; why: string | null }[] },
  demo = false,
): Act[] {
  const steps = parseMenu(event.menu);
  const byIndex = new Map(event.steps.map((s) => [s.index, s]));
  const [welcomeName, welcomeNote] = (event.welcomeDrink ?? "").split(/\s+\|\s+/);
  const acts: Act[] = [];
  const total = steps.length;

  const make = (index: number, dish: string, drink: string | null, label: string): Act => {
    const st = byIndex.get(index);
    let secret = st?.secret?.trim() || null;
    let decoys = (st?.decoys ?? "").split(",").map((d) => d.trim()).filter(Boolean);
    let why = st?.why?.trim() || null;
    if (demo && (!secret || decoys.length < 3)) {
      // El último ejemplo del banco es el del postre; los demás se reparten sin repetir mientras alcancen.
      const ex = label === "El postre" ? DEMO_BANK[DEMO_BANK.length - 1] : DEMO_BANK[index % (DEMO_BANK.length - 1)];
      secret = ex.secret;
      decoys = ex.decoys;
      why = why ?? ex.why;
    }
    // Alfabético a propósito: un orden "mezclado" con semilla fija delataría la posición del secreto real desde la demo.
    const options = secret && decoys.length >= 3 ? [secret, ...decoys.slice(0, 3)].sort((a, b) => a.localeCompare(b, "es")) : [];
    return { index, roman: `Acto ${ROMAN[index] ?? index + 1}`, label, dish, drink, why, options, secret: options.length ? secret : null };
  };

  acts.push(make(0, welcomeName?.trim() || (demo ? "Cóctel de recepción" : "Lo que tenés en la mano"), welcomeNote?.trim() || null, "La antesala"));
  steps.forEach((s, i) => acts.push(make(i + 1, s.dish, s.drink, labelForStep(i + 1, s.dish, total))));
  return acts;
}

/** Lo que ve el teléfono: los actos sin el secreto. */
export function publicActs(acts: Act[]) {
  return acts.map((a) => ({ index: a.index, roman: a.roman, label: a.label, dish: a.dish, drink: a.drink, why: a.why, options: a.options }));
}

/** "La casa va más por X": porcentaje de la ficha más votada, solo con 3 apuestas o más. Nunca cantidades. */
export async function getHouseLean(eventId: string, stepIndex: number): Promise<{ choice: string; pct: number } | null> {
  const rows = await prisma.guess.groupBy({ by: ["choice"], where: { eventId, stepIndex }, _count: { _all: true } });
  const total = rows.reduce((n, r) => n + r._count._all, 0);
  if (total < 3) return null;
  const top = rows.sort((a, b) => b._count._all - a._count._all)[0];
  return { choice: top.choice, pct: Math.round((top._count._all / total) * 100) };
}

/** Puntos de una apuesta: acertar suma lo apostado; errar con 3 ✦ resta 1 (con 1 ✦ no cuesta). */
export function guessPoints(stake: number, correct: boolean): number {
  if (correct) return stake;
  return stake === 3 ? -1 : 0;
}

export type TableRow = { table: number; points: number };

/** "La sala": puntos por mesita en la cena en vivo (solo mesitas con número; nunca cantidades de gente). */
export async function getTablesBoard(eventId: string): Promise<TableRow[]> {
  const rows = await prisma.guess.findMany({ where: { eventId, table: { not: null, gt: 0 } }, select: { table: true, stake: true, correct: true } });
  const totals = new Map<number, number>();
  for (const g of rows) totals.set(g.table!, (totals.get(g.table!) ?? 0) + guessPoints(g.stake, g.correct));
  return [...totals.entries()]
    .map(([table, points]) => ({ table, points: Math.max(0, points) }))
    .sort((a, b) => b.points - a.points || a.table - b.table)
    .slice(0, 8);
}

/** Porcentaje de aciertos de la sala en un acto (para el "el 25% de la casa acertó"). */
export async function getHitRate(eventId: string, stepIndex: number): Promise<number | null> {
  const [total, hits] = await Promise.all([
    prisma.guess.count({ where: { eventId, stepIndex } }),
    prisma.guess.count({ where: { eventId, stepIndex, correct: true } }),
  ]);
  if (total < 3) return null;
  return Math.round((hits / total) * 100);
}

/** Si una cena tiene el juego completo (secreto + 3 señuelos en todos los actos). */
export function gameReady(acts: Act[]): boolean {
  return acts.length > 0 && acts.every((a) => a.options.length === 4);
}
