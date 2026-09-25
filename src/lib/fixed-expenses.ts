import { prisma } from "./prisma";
import { argentinaDay } from "./dates";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Prorrateo semanal de un monto mensual: 12 meses ÷ 52 semanas. */
export function weeklyAmount(monthly: number): number {
  return Math.round((monthly * 12) / 52);
}

function mondayOf(dayUtcMidnight: number): number {
  const d = new Date(dayUtcMidnight);
  const dow = (d.getUTCDay() + 6) % 7;
  return dayUtcMidnight - dow * DAY_MS;
}

function periodKey(mondayMs: number): string {
  return new Date(mondayMs).toISOString().slice(0, 10);
}

export type FixedExpenseRow = {
  id: string;
  name: string;
  category: string;
  monthlyAmount: number;
  weeklyAmount: number;
  active: boolean;
  startsOn: string;
};

export async function getFixedExpenses(): Promise<FixedExpenseRow[]> {
  const rows = await prisma.fixedExpense.findMany({ orderBy: [{ active: "desc" }, { monthlyAmount: "desc" }] });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    monthlyAmount: r.monthlyAmount,
    weeklyAmount: weeklyAmount(r.monthlyAmount),
    active: r.active,
    startsOn: r.startsOn.toISOString().slice(0, 10),
  }));
}

/** Suma semanal de los fijos activos. */
export async function getWeeklyFixedTotal(): Promise<number> {
  const rows = await prisma.fixedExpense.findMany({ where: { active: true }, select: { monthlyAmount: true } });
  return rows.reduce((n, r) => n + weeklyAmount(r.monthlyAmount), 0);
}

/**
 * Genera los gastos semanales que falten, desde la semana en que empieza cada fijo
 * hasta la semana actual. Es idempotente: la clave (fijo, semana) es única.
 * Se llama al abrir Gastos, así no hace falta ningún cron.
 */
export async function ensureFixedEntries(): Promise<number> {
  const fixed = await prisma.fixedExpense.findMany({ where: { active: true } });
  if (fixed.length === 0) return 0;

  const currentMonday = mondayOf(argentinaDay().getTime());
  let created = 0;

  for (const f of fixed) {
    const firstMonday = mondayOf(argentinaDay(f.startsOn).getTime());
    // Como mucho un año hacia atrás, por si alguien pone una fecha muy vieja.
    const from = Math.max(firstMonday, currentMonday - 52 * 7 * DAY_MS);
    const existing = new Set(
      (await prisma.ledgerEntry.findMany({ where: { fixedExpenseId: f.id }, select: { periodKey: true } })).map((e) => e.periodKey),
    );
    const amount = weeklyAmount(f.monthlyAmount);
    for (let m = from; m <= currentMonday; m += 7 * DAY_MS) {
      const key = periodKey(m);
      if (existing.has(key)) continue;
      await prisma.ledgerEntry.create({
        data: {
          kind: "EXPENSE",
          category: f.category,
          description: `${f.name} (fijo, semana)`,
          amount,
          day: new Date(m),
          by: null,
          fromPocket: false,
          createdBy: "sistema",
          fixedExpenseId: f.id,
          periodKey: key,
        },
      });
      created++;
    }
  }
  return created;
}

/**
 * Cuando cambia el monto de un fijo, se actualiza el gasto de la semana actual
 * si nadie lo tocó a mano. Las semanas pasadas quedan como estaban.
 */
export async function refreshCurrentWeekEntry(fixedExpenseId: string) {
  const f = await prisma.fixedExpense.findUnique({ where: { id: fixedExpenseId } });
  if (!f) return;
  const key = periodKey(mondayOf(argentinaDay().getTime()));
  await prisma.ledgerEntry.updateMany({
    where: { fixedExpenseId, periodKey: key, updatedBy: null, deletedAt: null },
    data: { amount: weeklyAmount(f.monthlyAmount), category: f.category, description: `${f.name} (fijo, semana)` },
  });
}

/** Lo que se paga por mes en gastos fijos activos: la base del plan de la caja. */
export async function getMonthlyFixedTotal(): Promise<number> {
  const rows = await prisma.fixedExpense.findMany({ where: { active: true }, select: { monthlyAmount: true } });
  return rows.reduce((n, r) => n + r.monthlyAmount, 0);
}
