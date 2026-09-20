/**
 * Metas, tipos y reglas puras de los juegos de /hoy/jugar. Sin base de datos: lo importan los componentes cliente.
 */

/** Cuántos juegos hay que lograr para el trago (todos menos dos: la mímica necesita mesa, y uno de yapa). */
export const PREMIO_MINIMO = 8;

export const GAMES = ["maridaje", "servicio", "gato", "memoria", "chef", "lisandro", "copa", "simon", "mimica", "trivia"] as const;
export type GameId = (typeof GAMES)[number];

/** Lo que hay que lograr en cada juego para el premio. Difícil a propósito. */
export const METAS: Record<GameId, number> = {
  /** Maridaje: racha de aciertos seguidos (los platos vuelven con otros señuelos; el reloj se acelera). */
  maridaje: 8,
  /** Servicio: pedidos entregados antes de que se vayan tres clientes. */
  servicio: 10,
  /** El gato de la casa (snake): ingredientes comidos. */
  gato: 15,
  /** Memotest de 8 pares en 20 movimientos o menos. */
  memoria: 20,
  /** Atrapá al chef: puntos en 30 segundos. */
  chef: 30,
  /** ¿Dónde está Lisandro?: puntos en 30 segundos (topo). */
  lisandro: 20,
  /** Llená la copa: puntos sobre 500 (cinco copas). */
  copa: 360,
  /** Simón de la barra: ronda alcanzada. */
  simon: 8,
  /** Mímica: acertadas en 60 segundos. */
  mimica: 6,
  /** Trivia: racha de aciertos seguidos (con reloj). */
  trivia: 10,
};

/** En memoria gana el número más bajo; en el resto, el más alto. */
export const LOWER_IS_BETTER: Record<GameId, boolean> = { maridaje: false, servicio: false, gato: false, memoria: true, chef: false, lisandro: false, copa: false, simon: false, mimica: false, trivia: false };

export type Marcas = Partial<Record<GameId, number>> & { premio?: string | null; name?: string | null };
export type RecordRow = { name: string; best: number };
export type Records = Record<GameId, RecordRow[]>;

/** Día argentino como "2026-09-25": los premios se cuentan por noche. */
export function dayKey(now = Date.now()): string {
  return new Date(now - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function logrado(game: GameId, best: number | undefined | null): boolean {
  if (best == null) return false;
  return LOWER_IS_BETTER[game] ? best <= METAS[game] : best >= METAS[game];
}

export function mejora(game: GameId, value: number, current: number | undefined | null): boolean {
  if (current == null) return true;
  return LOWER_IS_BETTER[game] ? value < current : value > current;
}

/** Valores imposibles se descartan sin guardar (un memotest de 8 pares no baja de 8 movimientos, etc.). */
export function plausible(game: GameId, value: number): boolean {
  if (!Number.isInteger(value) || value < 0) return false;
  const max: Record<GameId, number> = { maridaje: 80, servicio: 200, gato: 400, memoria: 200, chef: 90, lisandro: 90, copa: 500, simon: 30, mimica: 40, trivia: 80 };
  if (game === "memoria" && value < 8) return false;
  return value <= max[game];
}

/** Nombre para los récords: corto, sin saltos de línea ni links. */
export function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const n = raw
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 18);
  return n.length >= 2 ? n : null;
}
