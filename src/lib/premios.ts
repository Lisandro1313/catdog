import { prisma } from "./prisma";
import { GAMES, LOWER_IS_BETTER, PREMIO_MINIMO, dayKey, logrado, mejora, type GameId, type Marcas, type Records } from "./juegos";
import { getTonightEvent } from "./hoy";

export { GAMES, METAS, PREMIO_MINIMO, LOWER_IS_BETTER, logrado, mejora, plausible, cleanName, dayKey, type GameId, type Marcas, type Records, type RecordRow } from "./juegos";

/**
 * Marcas, récords y premio de los juegos de /hoy/jugar. Todo se cuenta por teléfono (cookie anónima
 * emitida por el servidor). Las marcas son por noche (día argentino): el premio se gana esa noche, con
 * cena en vivo, logrando la meta en todos los juegos menos uno; los récords miran todas las noches.
 */

export async function getMarcas(deviceKey: string): Promise<Marcas> {
  const day = dayKey();
  const [scores, prize, named] = await Promise.all([
    prisma.gameScore.findMany({ where: { deviceKey, day } }),
    prisma.prize.findFirst({ where: { deviceKey, day } }),
    prisma.gameScore.findFirst({ where: { deviceKey, name: { not: null } }, select: { name: true } }),
  ]);
  const m: Marcas = { premio: prize?.code ?? null, name: named?.name ?? null };
  for (const s of scores) if ((GAMES as readonly string[]).includes(s.game)) m[s.game as GameId] = s.best;
  return m;
}

/** Guarda la marca de esta noche si mejora la anterior. Devuelve si fue mejora. */
export async function saveScore(deviceKey: string, game: GameId, value: number, name: string | null): Promise<boolean> {
  const day = dayKey();
  const current = await prisma.gameScore.findUnique({ where: { deviceKey_game_day: { deviceKey, game, day } } });
  if (!mejora(game, value, current?.best)) return false;
  await prisma.gameScore.upsert({
    where: { deviceKey_game_day: { deviceKey, game, day } },
    update: { best: value, ...(name ? { name } : {}) },
    create: { deviceKey, game, best: value, name, day },
  });
  return true;
}

/** Top 5 por juego, de todas las noches, un lugar por teléfono, solo de quienes pusieron nombre. */
export async function getRecords(): Promise<Records> {
  const out = {} as Records;
  await Promise.all(
    GAMES.map(async (g) => {
      const rows = await prisma.gameScore.findMany({
        where: { game: g, name: { not: null } },
        orderBy: [{ best: LOWER_IS_BETTER[g] ? "asc" : "desc" }, { updatedAt: "asc" }],
        take: 40,
        select: { name: true, best: true, deviceKey: true },
      });
      const seen = new Set<string>();
      out[g] = rows
        .filter((r) => (seen.has(r.deviceKey) ? false : (seen.add(r.deviceKey), true)))
        .slice(0, 5)
        .map((r) => ({ name: r.name ?? "", best: r.best }));
    }),
  );
  return out;
}

const ABC = "BCDFGHJKLMNPQRSTVWXZ";

/** Código corto para la barra: día del mes + cuatro letras (sin vocales, para que no arme palabras). */
function newCode(): string {
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000).getUTCDate();
  let s = "";
  for (let i = 0; i < 4; i++) s += ABC[Math.floor(Math.random() * ABC.length)];
  return `${String(d).padStart(2, "0")}${s}`;
}

/**
 * Emite el premio de la noche para ese teléfono si hay cena en vivo y esta noche logró la meta en
 * PREMIO_MINIMO juegos (o devuelve el que ya tenía).
 */
export async function issuePrizeIfEarned(deviceKey: string): Promise<string | null> {
  const m = await getMarcas(deviceKey);
  if (m.premio) return m.premio;
  const logrados = GAMES.filter((g) => logrado(g, m[g])).length;
  if (logrados < PREMIO_MINIMO) return null;
  if (!(await getTonightEvent())) return null;
  const day = dayKey();
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const p = await prisma.prize.create({ data: { code: newCode(), deviceKey, day } });
      return p.code;
    } catch {
      // Código repetido (muy raro) o el mismo teléfono ganó dos veces a la vez: releer / reintentar.
      const again = await prisma.prize.findFirst({ where: { deviceKey, day } });
      if (again) return again.code;
    }
  }
  return null;
}
