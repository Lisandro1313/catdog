import { prisma } from "./prisma";
import { argentinaDay } from "./dates";
import type { Via } from "./caja-tipos";

/**
 * Cerrar el día: lo que vendimos y lo que gastamos, cargado de una vez al final.
 *
 * No hay circuito de mostrador ni cobro por ticket. La noche se atiende como siempre y después
 * alguien se sienta y pasa los números. Esta es la puerta para eso.
 *
 * La venta de cada día se guarda con un id armado (día + forma de pago), así cargarla de nuevo la
 * corrige en vez de duplicarla: el error más común es tipear mal y volver a cargar.
 */

export const VIAS_VENTA: Via[] = ["efectivo", "transferencia", "tarjeta"];

/** El id fijo de la venta de un día por forma de pago. */
function idVenta(dia: string, via: Via): string {
  return `dia-${dia}-${via}`;
}

export type VentaDelDia = { via: Via; monto: number };

/**
 * Guarda lo que se vendió ese día, una línea por forma de pago. Un monto en cero borra la línea:
 * sirve para corregir cuando se cargó de más.
 */
export async function guardarVentaDelDia(input: { dia: string; ventas: VentaDelDia[]; quien: string }): Promise<number> {
  const fecha = new Date(`${input.dia}T00:00:00Z`);
  let guardadas = 0;
  for (const { via, monto } of input.ventas) {
    const id = idVenta(input.dia, via);
    if (monto <= 0) {
      // Borrado de verdad y no a la papelera: una línea en cero nunca existió.
      await prisma.ledgerEntry.deleteMany({ where: { id } });
      continue;
    }
    guardadas += 1;
    const datos = {
      kind: "INCOME" as const,
      category: "barra",
      description: `Venta del día · ${via}`,
      amount: monto,
      via,
      day: fecha,
      by: input.quien,
      fromPocket: false,
    };
    await prisma.ledgerEntry.upsert({
      where: { id },
      update: { ...datos, updatedAt: new Date(), updatedBy: input.quien, deletedAt: null },
      create: { id, ...datos, createdBy: input.quien },
    });
  }
  return guardadas;
}

export type ResumenDia = {
  dia: string;
  ventas: { via: Via; monto: number }[];
  totalVentas: number;
  gastos: { id: string; category: string; description: string | null; amount: number; fromPocket: boolean }[];
  totalGastos: number;
  /** Lo que quedó: lo vendido menos lo gastado ese día. */
  resultado: number;
};

/** Cómo viene un día: lo cargado hasta ahora, para no cargarlo dos veces. */
export async function getResumenDia(dia: string): Promise<ResumenDia> {
  const fecha = new Date(`${dia}T00:00:00Z`);
  const filas = await prisma.ledgerEntry.findMany({
    where: { day: fecha, deletedAt: null },
    select: { id: true, kind: true, category: true, description: true, amount: true, via: true, fromPocket: true },
  });

  const ventas = VIAS_VENTA.map((via) => ({
    via,
    monto: filas.find((f) => f.id === idVenta(dia, via))?.amount ?? 0,
  }));
  // Lo que se vendió ese día, incluida cualquier otra entrada de plata cargada aparte.
  const totalVentas = filas.filter((f) => f.kind === "INCOME").reduce((n, f) => n + f.amount, 0);

  const gastos = filas
    .filter((f) => f.kind === "EXPENSE")
    .map((f) => ({ id: f.id, category: f.category, description: f.description, amount: f.amount, fromPocket: f.fromPocket }));
  const totalGastos = gastos.reduce((n, f) => n + f.amount, 0);

  return { dia, ventas, totalVentas, gastos, totalGastos, resultado: totalVentas - totalGastos };
}

/** Hoy, en formato YYYY-MM-DD con la fecha argentina. */
export function hoyIso(): string {
  return argentinaDay().toISOString().slice(0, 10);
}
