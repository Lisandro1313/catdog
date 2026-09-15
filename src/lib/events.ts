import { prisma } from "./prisma";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** "II" → "III", "IV" → "V"… para numerar las cenas. */
export function nextRoman(roman: string): string {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  const up = roman.toUpperCase();
  let value = 0;
  for (let i = 0; i < up.length; i++) {
    const cur = map[up[i]] ?? 0;
    const next = map[up[i + 1]] ?? 0;
    value += cur < next ? -cur : cur;
  }
  value += 1;
  const table: [number, string][] = [
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  for (const [num, sym] of table) while (value >= num) {
    out += sym;
    value -= num;
  }
  return out;
}

/** Copia una cena a la misma hora de la semana siguiente, sin publicar, con el número siguiente en el título. */
export async function duplicateWeekLater(sourceId: string) {
  const source = await prisma.event.findUnique({ where: { id: sourceId } });
  if (!source) return null;
  const date = new Date(source.date.getTime() + WEEK_MS);
  const n = source.title.match(/^Cena\s+([IVXLC]+)\s*·\s*(.+)$/i);
  const title = n ? `Cena ${nextRoman(n[1])} · ${n[2]}` : source.title;
  return prisma.event.create({
    data: {
      title,
      date,
      price: source.price,
      capacity: source.capacity,
      description: source.description,
      menu: source.menu,
      bar: source.bar,
      barPrice: source.barPrice,
      address: source.address,
      published: false,
    },
  });
}

/**
 * Si la última cena ya pasó y no hay ninguna cargada después, deja un borrador para la semana siguiente
 * (sin publicar) así el panel siempre tiene la próxima lista para revisar y publicar.
 */
export async function ensureNextDraft(now = new Date()): Promise<string | null> {
  const upcoming = await prisma.event.count({ where: { date: { gt: now } } });
  if (upcoming > 0) return null;
  const last = await prisma.event.findFirst({ where: { published: true }, orderBy: { date: "desc" } });
  if (!last) return null;
  const copy = await duplicateWeekLater(last.id);
  return copy?.id ?? null;
}
