import { prisma } from "./prisma";
import { argentinaDay } from "./dates";

const DAY_MS = 24 * 60 * 60 * 1000;

export type VisitStats = {
  today: number;
  last7: number;
  last30: number;
  /** Últimos 14 días, del más viejo al más nuevo. */
  daily: { day: Date; count: number }[];
  /** Visitas por página en los últimos 30 días, de mayor a menor. */
  byPath: { path: string; count: number }[];
};

export async function getVisitStats(): Promise<VisitStats> {
  const today = argentinaDay();
  const from30 = new Date(today.getTime() - 29 * DAY_MS);
  // Todas las rutas públicas (el endpoint ya descarta /admin).
  const rows = await prisma.pageView.findMany({
    where: { day: { gte: from30 } },
    select: { day: true, count: true, path: true },
  });
  const byDay = new Map<number, number>();
  for (const r of rows) byDay.set(r.day.getTime(), (byDay.get(r.day.getTime()) ?? 0) + r.count);

  const sumSince = (days: number) => {
    const from = today.getTime() - (days - 1) * DAY_MS;
    let n = 0;
    for (const [t, c] of byDay) if (t >= from) n += c;
    return n;
  };
  const daily = Array.from({ length: 14 }, (_, i) => {
    const t = today.getTime() - (13 - i) * DAY_MS;
    return { day: new Date(t), count: byDay.get(t) ?? 0 };
  });
  const paths = new Map<string, number>();
  for (const r of rows) paths.set(r.path, (paths.get(r.path) ?? 0) + r.count);
  const byPath = Array.from(paths, ([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count);

  return { today: byDay.get(today.getTime()) ?? 0, last7: sumSince(7), last30: sumSince(30), daily, byPath };
}

export type Financials = {
  /** Cobrado por reservas (PAID). */
  reservations: number;
  /** Ingresos cargados en caja (barra y otros). */
  otherIncome: number;
  /** Gastos cargados en caja. */
  expenses: number;
  /** reservations + otherIncome - expenses */
  result: number;
  byCategory: { kind: "INCOME" | "EXPENSE"; category: string; amount: number }[];
};

export async function getFinancials(eventId?: string): Promise<Financials> {
  const where = eventId ? { eventId } : {};
  const [paid, ledger] = await Promise.all([
    prisma.reservation.aggregate({ where: { ...where, status: "PAID" }, _sum: { amount: true } }),
    prisma.ledgerEntry.groupBy({ by: ["kind", "category"], where, _sum: { amount: true } }),
  ]);
  const byCategory = ledger.map((l) => ({ kind: l.kind, category: l.category, amount: l._sum.amount ?? 0 }));
  const otherIncome = byCategory.filter((c) => c.kind === "INCOME").reduce((n, c) => n + c.amount, 0);
  const expenses = byCategory.filter((c) => c.kind === "EXPENSE").reduce((n, c) => n + c.amount, 0);
  const reservations = paid._sum.amount ?? 0;
  return { reservations, otherIncome, expenses, result: reservations + otherIncome - expenses, byCategory };
}

export type Contact = {
  email: string;
  name: string;
  phone: string | null;
  dinners: number;
  seats: number;
  spent: number;
  lastDate: Date;
};

/** Gente que pagó al menos una vez, una fila por email. */
export async function getContacts(): Promise<Contact[]> {
  const rows = await prisma.reservation.findMany({
    where: { status: "PAID", NOT: { email: "sin-email@local" } },
    select: { email: true, name: true, phone: true, quantity: true, amount: true, event: { select: { date: true } } },
    orderBy: { paidAt: "desc" },
  });
  const map = new Map<string, Contact>();
  for (const r of rows) {
    const c = map.get(r.email);
    if (c) {
      c.dinners += 1;
      c.seats += r.quantity;
      c.spent += r.amount;
      if (!c.phone && r.phone) c.phone = r.phone;
      if (r.event.date > c.lastDate) c.lastDate = r.event.date;
    } else {
      map.set(r.email, {
        email: r.email,
        name: r.name,
        phone: r.phone,
        dinners: 1,
        seats: r.quantity,
        spent: r.amount,
        lastDate: r.event.date,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime());
}

export { LEDGER_CATEGORIES, categoryLabel } from "./ledger-categories";
