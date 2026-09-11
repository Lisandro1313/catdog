import { generateText, Output } from "ai";
import { z } from "zod";
import { prisma } from "./prisma";
import { formatPrice } from "./config";
import { argentinaDay, formatDay, formatLong } from "./dates";
import { getNextEvent } from "./reservations";
import { getPartnerReport, getWeeklyReport } from "./admin-stats";
import { LEDGER_CATEGORIES, categoryLabel } from "./ledger-categories";

/** Modelo vía Vercel AI Gateway. Se factura con la cuenta de Vercel. */
const MODEL = "anthropic/claude-opus-5";

export const analysisSchema = z.object({
  estado: z.enum(["bien", "justo", "rojo"]).describe("Cómo viene el negocio en una palabra."),
  titular: z.string().describe("Una frase corta, en criollo, que resuma la situación. Sin números."),
  resumen: z.array(z.string()).min(2).max(4).describe("2 a 4 oraciones simples, con los números que importan."),
  proyeccion: z.object({
    semanaQueViene: z.string().describe("Qué resultado se espera la semana próxima y por qué, con números."),
    paraCubrirGastos: z.string().describe("Cuántos cubiertos por semana hacen falta para cubrir los gastos, y cómo vienen respecto a eso."),
  }),
  socios: z
    .array(
      z.object({
        nombre: z.string(),
        mensaje: z.string().describe("Qué puede retirar hoy, qué le queda pendiente y cuándo, en una o dos oraciones."),
      }),
    )
    .describe("Uno por socio."),
  alertas: z.array(z.string()).max(3).describe("Cosas a vigilar. Vacío si no hay nada serio."),
  sugerencias: z.array(z.string()).min(1).max(4).describe("Acciones concretas, simples y accionables esta semana."),
});

export type Analysis = z.infer<typeof analysisSchema>;

export type StoredAnalysis = { analysis: Analysis; generatedAt: string; model: string };

const KEY = "ai:analysis";

export async function getStoredAnalysis(): Promise<StoredAnalysis | null> {
  const s = await prisma.setting.findUnique({ where: { key: KEY } });
  if (!s) return null;
  try {
    return JSON.parse(s.value) as StoredAnalysis;
  } catch {
    return null;
  }
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL);
}

/** Arma el resumen de datos que lee el modelo. Todo en texto plano, sin ids. */
async function buildSnapshot(): Promise<string> {
  const [nextEvent, partners] = await Promise.all([getNextEvent(), getPartnerReport()]);
  const weekly = await getWeeklyReport(8, nextEvent?.price);
  const today = argentinaDay();

  const from = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000);
  const byCat = await prisma.ledgerEntry.groupBy({
    by: ["category"],
    where: { kind: "EXPENSE", day: { gte: from } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  let upcoming = "No hay próxima cena publicada.";
  if (nextEvent) {
    const paid = await prisma.reservation.aggregate({
      where: { eventId: nextEvent.id, status: "PAID" },
      _sum: { quantity: true, amount: true },
    });
    upcoming = [
      `Próxima cena: "${nextEvent.title}" el ${formatLong(nextEvent.date)}.`,
      `Precio por persona: ${formatPrice(nextEvent.price)}. Capacidad: ${nextEvent.capacity} cubiertos.`,
      `Reservas pagadas hasta ahora: ${paid._sum.quantity ?? 0} cubiertos (${formatPrice(paid._sum.amount ?? 0)}).`,
      nextEvent.barPrice ? `Barra: tragos a ${formatPrice(nextEvent.barPrice)} cada uno, aparte del menú.` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  const weeks = weekly.weeks
    .map(
      (w) =>
        `- Semana ${formatDay(w.start)} a ${formatDay(w.end)}${w.isCurrent ? " (actual, en curso)" : ""}: reservas ${formatPrice(w.reservations)} (${w.covers} cubiertos), barra y otros ${formatPrice(w.otherIncome)}, gastos ${formatPrice(w.expenses)}, resultado ${formatPrice(w.result)}.`,
    )
    .join("\n");

  const cats = byCat.length
    ? byCat.map((c) => `- ${categoryLabel("EXPENSE", c.category)}: ${formatPrice(c._sum.amount ?? 0)}`).join("\n")
    : "- (sin gastos cargados en los últimos 28 días)";

  const socios = partners.partners
    .map(
      (p) =>
        `- ${p.name}: puso ${formatPrice(p.putIn)}, le corresponde de ganancia ${formatPrice(p.profitShare)}, ya retiró ${formatPrice(p.withdrawn)}, le deben ${formatPrice(Math.max(0, p.owed))}, puede retirar hoy ${formatPrice(p.canTakeNow)}, queda pendiente ${formatPrice(p.pending)}.`,
    )
    .join("\n");

  return `HOY: ${formatLong(today)}.

${upcoming}

SEMANA A SEMANA (las reservas cuentan en la semana de la cena; gastos y barra el día que se cargan):
${weeks}

GASTOS POR RUBRO, ÚLTIMOS 28 DÍAS:
${cats}

PROMEDIO DE GASTOS POR SEMANA (últimas 4 con movimientos): ${weekly.avgWeeklyExpenses === null ? "sin datos" : formatPrice(weekly.avgWeeklyExpenses)}.
CUBIERTOS POR SEMANA PARA CUBRIR ESE PROMEDIO: ${weekly.breakEvenCovers ?? "sin datos"}.

ACUMULADO DESDE EL INICIO:
- Ingresos: ${formatPrice(partners.income)} (reservas + barra + otros)
- Gastos: ${formatPrice(partners.expenses)}
- Ganancia: ${formatPrice(partners.profit)}
- Plata en el negocio (caja): ${formatPrice(partners.cash)}
- Reserva para gastos fijos que se guarda antes de repartir: ${formatPrice(partners.reserve)}
- Disponible para repartir hoy: ${formatPrice(partners.available)}
- Ganancia repartible (la que supera la reserva): ${formatPrice(partners.distributable)}
${partners.shortfall > 0 ? `- Falta ${formatPrice(partners.shortfall)} para pagar todo lo que se les debe a los socios.` : "- Alcanza para pagar todo lo que se les debe a los socios."}

CUENTAS ENTRE SOCIOS (regla: primero se devuelve lo que cada uno puso de su bolsillo, después la ganancia se reparte en partes iguales; si no alcanza, a prorrata y el resto queda pendiente):
${socios}

RUBROS DE GASTO POSIBLES: ${LEDGER_CATEGORIES.EXPENSE.map((c) => c.label).join(", ")}.`;
}

const SYSTEM = `Sos el contador de confianza de dos socios que hacen cenas a puertas cerradas en La Plata, Argentina: una cena por semana, mesa única, menú de cinco pasos con trago, y barra aparte. Ellos cargan gastos e ingresos en una app y vos les explicás cómo viene la cosa.

Cómo hablar:
- Español rioplatense, voseo, frases cortas. Uno de los socios no maneja tecnología ni finanzas: nada de jerga. "Ganancia", "plata en caja", "lo que pusiste", "lo que podés retirar".
- Sé honesto y concreto. Si están en rojo, decilo sin vueltas y explicá por qué. Si están bien, no infles.
- Usá los números que te dan, con el formato $ 21.000. No inventes datos que no estén. Si falta información (por ejemplo, pocas semanas de historia), decilo y no proyectes de más.
- Proyectá con lo que hay: reservas pagadas de la próxima cena, capacidad y precio, promedio de gastos semanales. Aclará que las reservas todavía pueden crecer hasta el día de la cena.
- Sobre los retiros: respetá exactamente los números de "puede retirar hoy" y "queda pendiente" que te dan. Vos los explicás, no los recalculás.
- Las sugerencias tienen que ser cosas que puedan hacer esta semana (vender más cubiertos, empujar la barra, mirar un rubro que se fue de mano, ajustar la reserva, etc.).`;

export async function runAnalysis(): Promise<StoredAnalysis> {
  const snapshot = await buildSnapshot();
  const { output } = await generateText({
    model: MODEL,
    reasoning: "medium",
    system: SYSTEM,
    prompt: `Estos son los datos al día de hoy. Analizalos y completá el informe.\n\n${snapshot}`,
    output: Output.object({ schema: analysisSchema }),
  });
  const stored: StoredAnalysis = { analysis: output, generatedAt: new Date().toISOString(), model: MODEL };
  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: JSON.stringify(stored) },
    create: { key: KEY, value: JSON.stringify(stored) },
  });
  return stored;
}
