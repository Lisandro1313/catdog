import { prisma } from "./prisma";
import { GAMES, LOWER_IS_BETTER, dayKey, logrado, type GameId, type Marcas, type Records } from "./juegos";

export { GAMES, METAS, LOWER_IS_BETTER, logrado, mejora, plausible, cleanName, dayKey, type GameId, type Marcas, type Records, type RecordRow } from "./juegos";

/**
 * Marcas, récords y premio de los juegos de /hoy/jugar. Todo se cuenta por teléfono (cookie anónima
 * emitida por el servidor) y el código del trago lo emite el servidor: uno por teléfono y por noche.
 */

export async function getMarcas(deviceKey: string): Promise<Marcas> {
  const [scores, prize] = await Promise.all([
    prisma.gameScore.findMany({ where: { deviceKey } }),
    prisma.prize.findFirst({ where: { deviceKey, day: dayKey() } }),
  ]);
  const m: Marcas = { premio: prize?.code ?? null, name: scores.find((s) => s.name)?.name ?? null };
  for (const s of scores) if ((GAMES as readonly string[]).includes(s.game)) m[s.game as GameId] = s.best;
  return m;
}

/** Top 5 por juego, solo de quienes pusieron nombre. */
export async function getRecords(): Promise<Records> {
  const out = {} as Records;
  await Promise.all(
    GAMES.map(async (g) => {
      const rows = await prisma.gameScore.findMany({
        where: { game: g, name: { not: null } },
        orderBy: [{ best: LOWER_IS_BETTER[g] ? "asc" : "desc" }, { updatedAt: "asc" }],
        take: 5,
        select: { name: true, best: true },
      });
      out[g] = rows.map((r) => ({ name: r.name ?? "", best: r.best }));
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

/** Emite el premio de la noche para ese teléfono si logró todos los juegos (o devuelve el que ya tenía). */
export async function issuePrizeIfEarned(deviceKey: string): Promise<string | null> {
  const m = await getMarcas(deviceKey);
  if (m.premio) return m.premio;
  if (!GAMES.every((g) => logrado(g, m[g]))) return null;
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
