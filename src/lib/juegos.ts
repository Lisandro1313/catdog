/**
 * Metas, tipos y reglas puras de los juegos de /hoy/jugar. Sin base de datos: lo importan los componentes cliente.
 */

/** Cuántos juegos hay que lograr para el trago (todos menos dos: la mímica necesita mesa, y uno de yapa). */
export const PREMIO_MINIMO = 9;

export const GAMES = ["maridaje", "servicio", "gato", "ritmo", "memoria", "chef", "lisandro", "copa", "simon", "mimica", "trivia"] as const;
export type GameId = (typeof GAMES)[number];

/**
 * Lo que hay que lograr en cada juego para el premio. Difícil a propósito.
 * Recalibrado el 2026-09-27 con las marcas reales de las primeras noches: donde el promedio de la
 * gente ya rozaba o pasaba la meta, la meta subió. Los que nadie alcanzó (servicio, maridaje) quedaron
 * como estaban: no hacía falta que fueran más duros, hacía falta que los otros no fueran un trámite.
 */
export const METAS: Record<GameId, number> = {
  /** Maridaje: racha de aciertos seguidos (los platos vuelven con otros señuelos; el reloj se acelera).
   *  Sin tocar: de cuatro que jugaron, uno solo llegó a 8. */
  maridaje: 8,
  /** Servicio: pedidos entregados antes de que se vayan tres clientes. Sin tocar: el mejor hizo 7. */
  servicio: 10,
  /** El gato de la casa (snake): ingredientes comidos. Mejor marca real 29, promedio 12. */
  gato: 22,
  /** Ritmo de la casa: puntos en una canción. Era 40 y el promedio ya daba 44: lo lograba cualquiera. */
  ritmo: 62,
  /** Memotest de 8 pares, en movimientos (menos es mejor). Con 20 entraban todos; el mejor hizo 13. */
  memoria: 15,
  /** Atrapá al chef: puntos en 30 segundos. Mejor marca real 38. */
  chef: 38,
  /** Los de la casa: puntos en 30 segundos (topo con toda la familia). Mejor marca real 41. */
  lisandro: 38,
  /** Llená la copa: puntos sobre 500. Era 360 con un promedio de 359: la mitad lo sacaba de una. */
  copa: 430,
  /** Simón de la barra: ronda alcanzada. Mejor marca real 10. */
  simon: 10,
  /** Mímica: acertadas en 60 segundos. Se juega de a varios, así que sube poco. */
  mimica: 8,
  /** Trivia: racha de aciertos seguidos (con reloj). Mejor marca real 12. */
  trivia: 12,
};

/** En memoria gana el número más bajo; en el resto, el más alto. */
export const LOWER_IS_BETTER: Record<GameId, boolean> = { maridaje: false, servicio: false, gato: false, ritmo: false, memoria: true, chef: false, lisandro: false, copa: false, simon: false, mimica: false, trivia: false };

export type Marcas = Partial<Record<GameId, number>> & { premio?: string | null; premioAt?: string | null; name?: string | null };
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
const MAX: Record<GameId, number> = { maridaje: 80, servicio: 200, gato: 400, ritmo: 400, memoria: 200, chef: 90, lisandro: 200, copa: 500, simon: 30, mimica: 40, trivia: 80 };

export function plausible(game: GameId, value: number): boolean {
  if (!Number.isInteger(value) || value < 0) return false;
  if (game === "memoria" && value < 8) return false;
  return value <= MAX[game];
}

/** Las rachas (maridaje, trivia) no tienen fin: una partida larga legítima se recorta al tope en vez de descartarse. */
export function clampScore(game: GameId, value: number): number {
  return LOWER_IS_BETTER[game] ? value : Math.min(value, MAX[game]);
}

/**
 * Cuánto tiene que durar, como mínimo, una partida que llega a la meta. Un puntaje "logrado" que se
 * reporta antes de ese tiempo desde que se abrió el juego no puede venir de jugar: se rechaza.
 */
export const MIN_MS: Record<GameId, number> = {
  maridaje: 8000,
  servicio: 25000,
  gato: 15000,
  ritmo: 20000,
  memoria: 8000,
  chef: 20000,
  lisandro: 20000,
  copa: 8000,
  simon: 20000,
  mimica: 45000,
  trivia: 10000,
};

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

/** El reto del día: un juego distinto cada noche (fijo por fecha), sin la mímica. Lograrlo cuenta doble para el trago. */
export function retoDelDia(day = dayKey()): GameId {
  const pool = GAMES.filter((g) => g !== "mimica");
  let h = 0;
  for (let i = 0; i < day.length; i++) h = (h * 31 + day.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

/** Cuántos "logros" cuenta un teléfono para el trago: cada juego logrado vale 1, el reto del día vale 2. */
export function logrosParaPremio(m: Marcas, day = dayKey()): number {
  const reto = retoDelDia(day);
  return GAMES.reduce((n, g) => n + (logrado(g, m[g]) ? (g === reto ? 2 : 1) : 0), 0);
}

/** Con puntajes de dos jugadores, quién gana (0, 1) o empate (null). */
export function ganaDuelo(game: GameId, a: number, b: number): 0 | 1 | null {
  if (a === b) return null;
  return (LOWER_IS_BETTER[game] ? a < b : a > b) ? 0 : 1;
}
