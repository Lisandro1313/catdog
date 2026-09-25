import { prisma } from "./prisma";
import { CATEGORIA_ARQUEO, calcularSaldo, type SaldoCaja } from "./caja-tipos";

export { CATEGORIA_ARQUEO, calcularSaldo, diferenciaArqueo } from "./caja-tipos";
export type { MovimientoCaja, SaldoCaja } from "./caja-tipos";

/**
 * Lo que hay en la caja de efectivo del local, con el detalle de cómo se llegó a ese número.
 *
 * Nada de esto necesita una tabla nueva: la forma de pago ya está guardada en cada cuenta de la sala
 * (`coverVia` y `closedVia`) y en cada reserva (`paidVia`), y los gastos ya dicen si salieron de la
 * caja o del bolsillo de un socio (`fromPocket`).
 */
export async function getSaldoCaja(): Promise<SaldoCaja> {
  const [cuentas, reservas, movimientos] = await Promise.all([
    // Cobrado en mano en la sala: la cena de cada cuenta y lo consumido al cerrarla.
    prisma.cuenta.findMany({
      where: { OR: [{ coverVia: "efectivo" }, { closedVia: "efectivo" }] },
      select: { cover: true, coverVia: true, closedVia: true, consumos: { select: { qty: true, price: true, status: true } } },
    }),
    // Reservas pagadas en efectivo (las de Mercado Pago y transferencia no tocan el cajón).
    prisma.reservation.aggregate({ _sum: { amount: true }, where: { status: "PAID", paidVia: "efectivo" } }),
    // Gastos pagados de la caja, aportes y retiros. Lo que un socio puso de su bolsillo no entra acá.
    prisma.ledgerEntry.findMany({
      where: { deletedAt: null, OR: [{ kind: "EXPENSE", fromPocket: false }, { kind: "CONTRIBUTION" }, { kind: "WITHDRAWAL" }] },
      select: { kind: true, amount: true, category: true },
    }),
  ]);

  let cenas = 0;
  let consumos = 0;
  for (const c of cuentas) {
    if (c.coverVia === "efectivo") cenas += c.cover;
    if (c.closedVia === "efectivo") {
      for (const x of c.consumos) if (x.status !== "cancelado") consumos += x.qty * x.price;
    }
  }

  let gastos = 0;
  let aportes = 0;
  let retiros = 0;
  // Las diferencias de arqueo se guardan como gasto de la caja: si faltaba, la caja baja.
  let arqueos = 0;
  for (const m of movimientos) {
    if (m.kind === "CONTRIBUTION") aportes += m.amount;
    else if (m.kind === "WITHDRAWAL") retiros += m.amount;
    else if (m.category === CATEGORIA_ARQUEO) arqueos += m.amount;
    else gastos += m.amount;
  }

  return calcularSaldo([
    { concepto: "Cenas cobradas en mano", monto: cenas },
    { concepto: "Consumos cobrados en mano", monto: consumos },
    { concepto: "Reservas pagadas en efectivo", monto: reservas._sum.amount ?? 0 },
    { concepto: "Aportes de los socios", monto: aportes },
    { concepto: "Gastos pagados de la caja", monto: -gastos },
    { concepto: "Retiros de los socios", monto: -retiros },
    { concepto: "Diferencias de arqueo", monto: -arqueos },
  ]);
}
