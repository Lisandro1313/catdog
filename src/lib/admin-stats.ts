import { prisma } from "./prisma";
import { argentinaDay } from "./dates";
import { PARTNERS, PARTNER_SHARE, type AnyKind } from "./ledger-categories";

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
    prisma.ledgerEntry.groupBy({
      by: ["kind", "category"],
      where: { ...where, kind: { in: ["INCOME", "EXPENSE"] }, deletedAt: null },
      _sum: { amount: true },
    }),
  ]);
  const byCategory = ledger
    .filter((l) => l.kind === "INCOME" || l.kind === "EXPENSE")
    .map((l) => ({ kind: l.kind as "INCOME" | "EXPENSE", category: l.category, amount: l._sum.amount ?? 0 }));
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

// ---------------------------------------------------------------------------
// Reporte semanal: ingresos, gastos, resultado y reparto entre socios.
// ---------------------------------------------------------------------------

export type WeekReport = {
  /** Lunes de la semana, medianoche UTC (día argentino). */
  start: Date;
  /** Domingo de la semana. */
  end: Date;
  isCurrent: boolean;
  reservations: number;
  otherIncome: number;
  expenses: number;
  result: number;
  /** Gastos puestos por cada socio esta semana. */
  paidBy: Record<string, number>;
  /** Cubiertos pagados en cenas de esta semana. */
  covers: number;
};

export type LedgerRow = {
  id: string;
  kind: AnyKind;
  category: string;
  description: string | null;
  amount: number;
  /** "YYYY-MM-DD" (fecha argentina). Serializable para componentes cliente. */
  day: string;
  by: string | null;
  fromPocket: boolean;
  hasReceipt: boolean;
  eventTitle: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  deletedAt: string | null;
};

export type WeeklyReport = {
  weeks: WeekReport[]; // de la más nueva a la más vieja
  current: WeekReport;
  /** Totales desde el inicio. */
  total: { reservations: number; otherIncome: number; expenses: number; result: number; paidBy: Record<string, number> };
  /** Gasto promedio de las últimas 4 semanas con movimientos. */
  avgWeeklyExpenses: number | null;
  /** Cubiertos por semana necesarios para cubrir ese promedio, al precio de la próxima cena. */
  breakEvenCovers: number | null;
  recent: LedgerRow[];
};

type RawRow = {
  id: string;
  kind: AnyKind;
  category: string;
  description: string | null;
  amount: number;
  day: Date;
  by: string | null;
  fromPocket: boolean;
  receiptUrl: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  deletedAt: Date | null;
  event: { title: string } | null;
};

export function toRow(l: RawRow): LedgerRow {
  return {
    id: l.id,
    kind: l.kind,
    category: l.category,
    description: l.description,
    amount: l.amount,
    day: l.day.toISOString().slice(0, 10),
    by: l.by,
    fromPocket: l.fromPocket,
    hasReceipt: Boolean(l.receiptUrl),
    eventTitle: l.event?.title ?? null,
    createdBy: l.createdBy,
    updatedBy: l.updatedBy,
    deletedBy: l.deletedBy,
    deletedAt: l.deletedAt ? l.deletedAt.toISOString() : null,
  };
}

/** Movimientos en la papelera (borrados), los más recientes primero. */
export async function getTrash(): Promise<LedgerRow[]> {
  const rows = await prisma.ledgerEntry.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    take: 50,
    include: { event: { select: { title: true } } },
  });
  return rows.map(toRow);
}

function mondayOf(dayUtcMidnight: number): number {
  const d = new Date(dayUtcMidnight);
  const dow = (d.getUTCDay() + 6) % 7; // lunes = 0
  return dayUtcMidnight - dow * DAY_MS;
}

export async function getWeeklyReport(weeksBack = 8, nextEventPrice?: number): Promise<WeeklyReport> {
  const today = argentinaDay().getTime();
  const currentMonday = mondayOf(today);

  const [ledger, paid, recent] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: { deletedAt: null },
      select: { kind: true, amount: true, day: true, by: true, fromPocket: true },
    }),
    prisma.reservation.findMany({
      where: { status: "PAID" },
      select: { amount: true, quantity: true, event: { select: { date: true } } },
    }),
    prisma.ledgerEntry.findMany({
      where: { deletedAt: null },
      orderBy: [{ day: "desc" }, { createdAt: "desc" }],
      take: 60,
      include: { event: { select: { title: true } } },
    }),
  ]);

  const emptyWeek = (monday: number): WeekReport => ({
    start: new Date(monday),
    end: new Date(monday + 6 * DAY_MS),
    isCurrent: monday === currentMonday,
    reservations: 0,
    otherIncome: 0,
    expenses: 0,
    result: 0,
    paidBy: {},
    covers: 0,
  });

  const byWeek = new Map<number, WeekReport>();
  for (let i = 0; i < weeksBack; i++) {
    const m = currentMonday - i * 7 * DAY_MS;
    byWeek.set(m, emptyWeek(m));
  }
  const weekFor = (dayMs: number) => byWeek.get(mondayOf(dayMs));

  const total = { reservations: 0, otherIncome: 0, expenses: 0, result: 0, paidBy: {} as Record<string, number> };

  for (const l of ledger) {
    const w = weekFor(l.day.getTime());
    if (l.kind === "INCOME") {
      total.otherIncome += l.amount;
      if (w) w.otherIncome += l.amount;
    } else if (l.kind === "EXPENSE") {
      total.expenses += l.amount;
      if (l.by && l.fromPocket) total.paidBy[l.by] = (total.paidBy[l.by] ?? 0) + l.amount;
      if (w) {
        w.expenses += l.amount;
        if (l.by && l.fromPocket) w.paidBy[l.by] = (w.paidBy[l.by] ?? 0) + l.amount;
      }
    }
    // Aportes y retiros no son ingresos ni gastos: se ven en "Entre socios".
  }
  for (const r of paid) {
    total.reservations += r.amount;
    const w = weekFor(argentinaDay(r.event.date).getTime());
    if (w) {
      w.reservations += r.amount;
      w.covers += r.quantity;
    }
  }
  total.result = total.reservations + total.otherIncome - total.expenses;

  const weeks = Array.from(byWeek.values())
    .map((w) => ({ ...w, result: w.reservations + w.otherIncome - w.expenses }))
    .sort((a, b) => b.start.getTime() - a.start.getTime());
  const current = weeks[0];

  const withExpenses = weeks.filter((w) => w.expenses > 0).slice(0, 4);
  const avgWeeklyExpenses = withExpenses.length
    ? Math.round(withExpenses.reduce((n, w) => n + w.expenses, 0) / withExpenses.length)
    : null;
  const breakEvenCovers =
    avgWeeklyExpenses !== null && nextEventPrice && nextEventPrice > 0 ? Math.ceil(avgWeeklyExpenses / nextEventPrice) : null;

  return {
    weeks,
    current,
    total,
    avgWeeklyExpenses,
    breakEvenCovers,
    recent: recent.map(toRow),
  };
}

// ---------------------------------------------------------------------------
// Cuentas entre socios (acumulado desde el inicio).
//
// Regla: la ganancia es ingresos − gastos. De la caja se guarda una reserva
// para gastos fijos. Con lo que queda, primero se le devuelve a cada socio lo
// que puso de su bolsillo; después la ganancia se reparte en partes iguales.
// Si no alcanza para todos, se paga a prorrata y el resto queda pendiente.
// ---------------------------------------------------------------------------

export type PartnerAccount = {
  name: string;
  /** Lo que puso: gastos de su bolsillo + aportes en efectivo. */
  putIn: number;
  /** Su parte de la ganancia repartible. */
  profitShare: number;
  /** Lo que ya se llevó. */
  withdrawn: number;
  /** Lo que le corresponde cobrar todavía (negativo si se llevó de más). */
  owed: number;
  /** Lo que puede retirar hoy con la plata que hay. */
  canTakeNow: number;
  /** Lo que queda para más adelante. */
  pending: number;
};

export type PartnerReport = {
  income: number;
  expenses: number;
  profit: number;
  contributions: number;
  withdrawals: number;
  /** Plata del negocio ahora: ganancia + lo que pusieron − lo que retiraron. */
  cash: number;
  reserve: number;
  /** Caja menos reserva (nunca negativo). */
  available: number;
  /** Ganancia que se reparte: la que supera la reserva. */
  distributable: number;
  partners: PartnerAccount[];
  /** Cuánto falta para pagar todo lo que se debe. */
  shortfall: number;
};

export async function getReserve(): Promise<number> {
  const s = await prisma.setting.findUnique({ where: { key: "reserve" } });
  const n = s ? parseInt(s.value, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function getPartnerReport(): Promise<PartnerReport> {
  const [ledger, paid, reserve] = await Promise.all([
    prisma.ledgerEntry.findMany({ where: { deletedAt: null }, select: { kind: true, amount: true, by: true, fromPocket: true } }),
    prisma.reservation.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    getReserve(),
  ]);

  let income = paid._sum.amount ?? 0;
  let expenses = 0;
  let contributions = 0;
  let withdrawals = 0;
  const putIn: Record<string, number> = {};
  const withdrawn: Record<string, number> = {};
  for (const p of PARTNERS) {
    putIn[p] = 0;
    withdrawn[p] = 0;
  }
  const add = (map: Record<string, number>, who: string | null, amount: number) => {
    const key = who && who in map ? who : (PARTNERS[0] ?? "?");
    map[key] = (map[key] ?? 0) + amount;
  };

  for (const l of ledger) {
    switch (l.kind) {
      case "INCOME":
        income += l.amount;
        break;
      case "EXPENSE":
        expenses += l.amount;
        if (l.fromPocket) add(putIn, l.by, l.amount);
        break;
      case "CONTRIBUTION":
        contributions += l.amount;
        add(putIn, l.by, l.amount);
        break;
      case "WITHDRAWAL":
        withdrawals += l.amount;
        add(withdrawn, l.by, l.amount);
        break;
    }
  }

  const profit = income - expenses;
  const totalPutIn = Object.values(putIn).reduce((n, v) => n + v, 0);
  const cash = profit + totalPutIn - withdrawals;
  const available = Math.max(0, cash - reserve);
  const distributable = Math.max(0, profit - reserve);

  const raw = PARTNERS.map((name) => {
    const profitShare = Math.floor(distributable * PARTNER_SHARE);
    const owed = putIn[name] + profitShare - withdrawn[name];
    return { name, putIn: putIn[name], profitShare, withdrawn: withdrawn[name], owed };
  });
  const totalOwed = raw.reduce((n, p) => n + Math.max(0, p.owed), 0);
  const ratio = totalOwed > 0 ? Math.min(1, available / totalOwed) : 0;

  const partners: PartnerAccount[] = raw.map((p) => {
    const owedPos = Math.max(0, p.owed);
    const canTakeNow = Math.floor(owedPos * ratio);
    return { ...p, canTakeNow, pending: owedPos - canTakeNow };
  });

  return {
    income,
    expenses,
    profit,
    contributions,
    withdrawals,
    cash,
    reserve,
    available,
    distributable,
    partners,
    shortfall: Math.max(0, totalOwed - available),
  };
}
