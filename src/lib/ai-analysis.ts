import { generateText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { prisma } from "./prisma";
import { formatPrice } from "./config";
import { argentinaDay, formatDay, formatLong, weekOf } from "./dates";
import { getNextEvent } from "./reservations";
import { getPartnerReport, getWeeklyReport, type PartnerReport, type WeeklyReport } from "./admin-stats";
import { LEDGER_CATEGORIES, categoryLabel } from "./ledger-categories";

// ---------------------------------------------------------------------------
// Qué devuelve el análisis (lo mismo venga de reglas o de un modelo).
// ---------------------------------------------------------------------------

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

export type StoredAnalysis = {
  analysis: Analysis;
  generatedAt: string;
  /** "reglas" o el id del modelo que lo escribió. */
  model: string;
  /** Aviso si se pidió IA y se cayó a reglas. */
  note?: string;
};

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

// ---------------------------------------------------------------------------
// Proveedores. Orden: Gemini (gratis, sin tarjeta) → Vercel AI Gateway (con
// clave explícita) → reglas (siempre disponible, sin ningún servicio).
// ---------------------------------------------------------------------------

export type AnalysisMode = "gemini" | "gateway" | "reglas";

export function getAnalysisMode(): AnalysisMode {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "gemini";
  if (process.env.AI_GATEWAY_API_KEY) return "gateway";
  return "reglas";
}

export function modeLabel(model: string): string {
  if (model === "reglas") return "automático, por reglas (sin IA)";
  if (model.startsWith("google/")) return `IA · Gemini (${model.slice(7)})`;
  return `IA · ${model}`;
}

/** Candidatos de Gemini en orden: el alias "latest" primero y dos fijos por si el alias falla. */
const GEMINI_MODELS = ["gemini-flash-latest", "gemini-3.8-flash", "gemini-2.5-flash"] as const;
const GATEWAY_MODEL = "anthropic/claude-opus-5";

// ---------------------------------------------------------------------------
// Datos que lee el análisis (reglas o modelo).
// ---------------------------------------------------------------------------

type Snapshot = {
  today: Date;
  next: null | {
    title: string;
    dateLong: string;
    daysUntil: number;
    price: number;
    capacity: number;
    paidCovers: number;
    paidAmount: number;
    barPrice: number | null;
  };
  weekly: WeeklyReport;
  partners: PartnerReport;
  byCat: { label: string; amount: number }[];
  catTotal: number;
};

async function buildSnapshot(): Promise<Snapshot> {
  const [nextEvent, partners] = await Promise.all([getNextEvent(), getPartnerReport()]);
  const weekly = await getWeeklyReport(8, nextEvent?.price);
  const today = argentinaDay();
  const from = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000);
  const cats = await prisma.ledgerEntry.groupBy({
    by: ["category"],
    where: { kind: "EXPENSE", day: { gte: from }, deletedAt: null },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });
  const byCat = cats.map((c) => ({ label: categoryLabel("EXPENSE", c.category), amount: c._sum.amount ?? 0 }));
  const catTotal = byCat.reduce((n, c) => n + c.amount, 0);

  let next: Snapshot["next"] = null;
  if (nextEvent) {
    const paid = await prisma.reservation.aggregate({
      where: { eventId: nextEvent.id, status: "PAID" },
      _sum: { quantity: true, amount: true },
    });
    next = {
      title: nextEvent.title,
      dateLong: formatLong(nextEvent.date),
      daysUntil: weekOf(nextEvent.date).daysUntil,
      price: nextEvent.price,
      capacity: nextEvent.capacity,
      paidCovers: paid._sum.quantity ?? 0,
      paidAmount: paid._sum.amount ?? 0,
      barPrice: nextEvent.barPrice ?? null,
    };
  }
  return { today, next, weekly, partners, byCat, catTotal };
}

// ---------------------------------------------------------------------------
// Análisis por reglas: gratis, instantáneo y siempre igual para los mismos números.
// ---------------------------------------------------------------------------

export function buildRuleAnalysis(s: Snapshot): Analysis {
  const { partners: p, weekly, next } = s;
  const cur = weekly.current;
  const avg = weekly.avgWeeklyExpenses;
  const breakEven = weekly.breakEvenCovers;
  const hasData = p.income > 0 || p.expenses > 0;

  // Proyección: lo ya pagado de la próxima cena contra un gasto semanal promedio.
  const nextIncome = next?.paidAmount ?? 0;
  const projected = avg === null ? null : nextIncome - avg;

  // Estado
  let estado: Analysis["estado"];
  if (!hasData) estado = "justo";
  else if (p.profit < 0 && (projected === null || projected < 0)) estado = "rojo";
  else if (p.profit < 0 || (projected !== null && projected < 0) || (breakEven !== null && next !== null && next.paidCovers < breakEven)) estado = "justo";
  else estado = "bien";

  const titular = !hasData
    ? "Todavía hay pocos datos: cargá gastos y esperá las primeras reservas."
    : estado === "bien"
      ? "Las cenas están pagando los gastos y dejando ganancia."
      : estado === "justo"
        ? "Se cubre, pero con poco margen."
        : "Hoy los gastos superan lo que entró.";

  // Resumen
  const resumen: string[] = [];
  if (hasData) {
    resumen.push(
      p.profit >= 0
        ? `Desde el inicio entraron ${formatPrice(p.income)} y salieron ${formatPrice(p.expenses)}: ganancia de ${formatPrice(p.profit)}.`
        : `Desde el inicio entraron ${formatPrice(p.income)} y salieron ${formatPrice(p.expenses)}: pérdida de ${formatPrice(-p.profit)}.`,
    );
  } else {
    resumen.push("Todavía no hay ingresos ni gastos cargados.");
  }
  resumen.push(
    `Esta semana: reservas ${formatPrice(cur.reservations)}, barra ${formatPrice(cur.otherIncome)}, gastos ${formatPrice(cur.expenses)}. Resultado ${formatPrice(cur.result)}.`,
  );
  if (next) {
    resumen.push(
      `Para ${next.title} (${next.dateLong}) hay ${next.paidCovers} cubierto${next.paidCovers === 1 ? "" : "s"} pago${next.paidCovers === 1 ? "" : "s"}, ${formatPrice(next.paidAmount)}.${
        next.daysUntil > 0 ? ` Faltan ${next.daysUntil} día${next.daysUntil === 1 ? "" : "s"}.` : next.daysUntil === 0 ? " Es hoy." : ""
      }`,
    );
  }
  if (avg !== null) resumen.push(`Una semana promedio gasta ${formatPrice(avg)}.`);

  // Proyección
  const semanaQueViene = next
    ? avg === null
      ? `Hay ${formatPrice(nextIncome)} ya pagados para ${next.title}. Todavía no hay gastos cargados como para estimar cuánto queda.`
      : `Con lo pagado hasta hoy (${formatPrice(nextIncome)}) y un gasto promedio de ${formatPrice(avg)}, ${next.title} dejaría ${formatPrice(projected ?? 0)}. Las reservas pueden seguir creciendo hasta el día de la cena.`
    : avg === null
      ? "No hay una cena publicada. Sin cena no hay ingresos previstos."
      : `No hay una cena publicada: sin reservas, la semana que viene arrancaría en ${formatPrice(-avg)}.`;

  const paraCubrirGastos =
    breakEven !== null && next
      ? next.paidCovers >= breakEven
        ? `Hacen falta ${breakEven} cubierto${breakEven === 1 ? "" : "s"} por semana para cubrir el promedio de gastos (${formatPrice(avg ?? 0)}). Ya hay ${next.paidCovers}: lo que se venda de acá en más es ganancia.`
        : `Hacen falta ${breakEven} cubierto${breakEven === 1 ? "" : "s"} por semana para cubrir el promedio de gastos (${formatPrice(avg ?? 0)}). Hoy hay ${next.paidCovers}: faltan ${breakEven - next.paidCovers} más.`
      : "Cuando haya gastos cargados y una cena publicada, calculo cuántos cubiertos hacen falta para cubrirlos.";

  // Socios
  const socios = p.partners.map((a) => {
    const parts: string[] = [];
    parts.push(`Puso ${formatPrice(a.putIn)}${a.profitShare > 0 ? ` y le corresponden ${formatPrice(a.profitShare)} de ganancia` : ""}.`);
    if (a.withdrawn > 0) parts.push(`Ya retiró ${formatPrice(a.withdrawn)}.`);
    if (a.owed < 0) parts.push(`Retiró ${formatPrice(-a.owed)} de más: conviene compensarlo antes del próximo reparto.`);
    else if (a.canTakeNow > 0) parts.push(`Hoy puede retirar ${formatPrice(a.canTakeNow)}${a.pending > 0 ? ` y le quedan ${formatPrice(a.pending)} para cuando entre plata` : ""}.`);
    else if (a.pending > 0) parts.push(`Hoy no hay plata para devolverle; le quedan ${formatPrice(a.pending)} pendientes.`);
    else parts.push("No tiene nada pendiente.");
    return { nombre: a.name, mensaje: parts.join(" ") };
  });

  // Alertas
  const alertas: string[] = [];
  if (p.profit < 0) alertas.push(`El negocio está en rojo por ${formatPrice(-p.profit)}: los gastos superan los ingresos.`);
  if (breakEven !== null && next && breakEven > next.capacity) {
    alertas.push(
      `Para cubrir ${formatPrice(avg ?? 0)} por semana hacen falta ${breakEven} cubiertos y la mesa tiene ${next.capacity}: con reservas solas no alcanza, tiene que sumar la barra o bajar gastos.`,
    );
  }
  const top = s.byCat[0];
  if (top && s.catTotal > 0 && top.amount / s.catTotal >= 0.4 && s.byCat.length > 1) {
    alertas.push(`${top.label} se lleva el ${Math.round((top.amount / s.catTotal) * 100)}% de los gastos del último mes.`);
  }
  if (next && next.daysUntil >= 0 && next.daysUntil <= 3 && next.paidCovers < next.capacity / 2) {
    alertas.push(`Faltan ${next.daysUntil} día${next.daysUntil === 1 ? "" : "s"} para la cena y hay ${next.paidCovers} de ${next.capacity} cubiertos pagos.`);
  }
  if (p.shortfall > 0 && alertas.length < 3) alertas.push(`Faltan ${formatPrice(p.shortfall)} para devolverles a los socios lo que pusieron.`);
  if (p.reserve === 0 && hasData && alertas.length < 3) alertas.push("No hay reserva para gastos fijos: conviene fijar un monto en Entre socios.");

  // Sugerencias
  const sugerencias: string[] = [];
  if (next && next.paidCovers < next.capacity) {
    sugerencias.push(`Empujar las reservas de ${next.title}: quedan ${next.capacity - next.paidCovers} lugares por vender.`);
  }
  if (breakEven !== null && next && next.paidCovers >= breakEven) {
    sugerencias.push("Los gastos ya están cubiertos: cada cubierto extra y cada trago de barra van derecho a ganancia.");
  }
  if (breakEven !== null && next && breakEven > next.capacity && next.barPrice) {
    const gap = (avg ?? 0) - next.capacity * next.price;
    const drinks = Math.ceil(Math.max(0, gap) / next.barPrice);
    sugerencias.push(`Con la mesa llena faltan ${formatPrice(Math.max(0, gap))}: son unos ${drinks} tragos de barra a ${formatPrice(next.barPrice)}.`);
  }
  if (next && next.barPrice && cur.otherIncome === 0) {
    sugerencias.push("Cargar la barra al cierre de cada cena: sin eso el resultado queda corto.");
  }
  if (top && s.catTotal > 0 && top.amount / s.catTotal >= 0.4 && s.byCat.length > 1) {
    sugerencias.push(`Revisar ${top.label.toLowerCase()}: es el gasto más pesado del mes.`);
  }
  if (p.reserve === 0) sugerencias.push("Definir la reserva para gastos fijos (alquiler, servicios) antes de repartir.");
  if (sugerencias.length === 0) sugerencias.push("Cargar todos los gastos con foto del comprobante para que los números sean confiables.");

  return {
    estado,
    titular,
    resumen: resumen.slice(0, 4),
    proyeccion: { semanaQueViene, paraCubrirGastos },
    socios,
    alertas: alertas.slice(0, 3),
    sugerencias: sugerencias.slice(0, 4),
  };
}

// ---------------------------------------------------------------------------
// Con modelo: le pasamos los números en texto y le pedimos el mismo formato.
// ---------------------------------------------------------------------------

function renderSnapshot(s: Snapshot): string {
  const { partners, weekly, next } = s;
  const upcoming = next
    ? [
        `Próxima cena: "${next.title}" el ${next.dateLong} (faltan ${next.daysUntil} días).`,
        `Precio por persona: ${formatPrice(next.price)}. Capacidad: ${next.capacity} cubiertos.`,
        `Reservas pagadas hasta ahora: ${next.paidCovers} cubiertos (${formatPrice(next.paidAmount)}).`,
        next.barPrice ? `Barra: tragos a ${formatPrice(next.barPrice)} cada uno, aparte del menú.` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "No hay próxima cena publicada.";

  const weeks = weekly.weeks
    .map(
      (w) =>
        `- Semana ${formatDay(w.start)} a ${formatDay(w.end)}${w.isCurrent ? " (actual, en curso)" : ""}: reservas ${formatPrice(w.reservations)} (${w.covers} cubiertos), barra y otros ${formatPrice(w.otherIncome)}, gastos ${formatPrice(w.expenses)}, resultado ${formatPrice(w.result)}.`,
    )
    .join("\n");

  const cats = s.byCat.length ? s.byCat.map((c) => `- ${c.label}: ${formatPrice(c.amount)}`).join("\n") : "- (sin gastos cargados en los últimos 28 días)";

  const socios = partners.partners
    .map(
      (p) =>
        `- ${p.name}: puso ${formatPrice(p.putIn)}, le corresponde de ganancia ${formatPrice(p.profitShare)}, ya retiró ${formatPrice(p.withdrawn)}, le deben ${formatPrice(Math.max(0, p.owed))}, puede retirar hoy ${formatPrice(p.canTakeNow)}, queda pendiente ${formatPrice(p.pending)}.`,
    )
    .join("\n");

  return `HOY: ${formatLong(s.today)}.

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

async function runModel(snapshot: string): Promise<{ analysis: Analysis; model: string }> {
  const prompt = `Estos son los datos al día de hoy. Analizalos y completá el informe.\n\n${snapshot}`;
  const mode = getAnalysisMode();

  if (mode === "gemini") {
    const google = createGoogleGenerativeAI();
    let lastErr: unknown;
    for (const id of GEMINI_MODELS) {
      try {
        const { output } = await generateText({ model: google(id), system: SYSTEM, prompt, output: Output.object({ schema: analysisSchema }) });
        return { analysis: output, model: `google/${id}` };
      } catch (err) {
        lastErr = err;
        console.warn(`[ia] gemini ${id} falló, pruebo el siguiente`, err instanceof Error ? err.message : err);
      }
    }
    throw lastErr;
  }

  if (mode === "gateway") {
    const { output } = await generateText({
      model: GATEWAY_MODEL,
      reasoning: "medium",
      system: SYSTEM,
      prompt,
      output: Output.object({ schema: analysisSchema }),
    });
    return { analysis: output, model: GATEWAY_MODEL };
  }

  throw new Error("Sin proveedor de IA configurado");
}

/**
 * Genera y guarda el análisis. Si hay un modelo configurado lo usa; si no
 * (o si falla), cae a las reglas, que siempre funcionan y no cuestan nada.
 */
export async function runAnalysis(): Promise<StoredAnalysis> {
  const snap = await buildSnapshot();
  let stored: StoredAnalysis;
  if (getAnalysisMode() === "reglas") {
    stored = { analysis: buildRuleAnalysis(snap), generatedAt: new Date().toISOString(), model: "reglas" };
  } else {
    try {
      const r = await runModel(renderSnapshot(snap));
      stored = { analysis: r.analysis, generatedAt: new Date().toISOString(), model: r.model };
    } catch (err) {
      console.error("[ia] modelo falló, uso reglas", err);
      const msg = err instanceof Error ? err.message : String(err);
      const note = /credit card|customer_verification/i.test(msg)
        ? "La IA de Vercel pide una tarjeta cargada; este análisis se hizo por reglas."
        : /API key|401|403|PERMISSION_DENIED|quota|429/i.test(msg)
          ? "La clave de IA no anduvo (inválida o sin cupo); este análisis se hizo por reglas."
          : "La IA no respondió; este análisis se hizo por reglas.";
      stored = { analysis: buildRuleAnalysis(snap), generatedAt: new Date().toISOString(), model: "reglas", note };
    }
  }
  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: JSON.stringify(stored) },
    create: { key: KEY, value: JSON.stringify(stored) },
  });
  return stored;
}
