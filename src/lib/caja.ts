import { prisma } from "./prisma";
import { CATEGORIA_ARQUEO, CATEGORIA_TRASPASO, armarSaldo, clasificarLedger, esEfectivo, type SaldoCaja } from "./caja-tipos";

export * from "./caja-tipos";

/**
 * La caja: la plata que el negocio cobró y todavía tiene, separada en billete y cuenta.
 *
 * La plata se cuenta de una sola fuente para no sumarla dos veces: las reservas pagadas (que viven en
 * su propia tabla) y los movimientos del libro. Las ventas de la noche entran al libro cuando se
 * cierra la caja de la sala, así que no hay que mirar las cuentas de la sala por separado.
 *
 * Una venta puede pasar en cualquier momento, no solo durante el servicio: una botella un martes al
 * mediodía se carga como ingreso y entra a la caja igual.
 */
export async function getSaldoCaja(): Promise<SaldoCaja> {
  const [reservas, movimientos] = await Promise.all([
    prisma.reservation.groupBy({ by: ["paidVia"], where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.ledgerEntry.findMany({
      where: { deletedAt: null },
      select: { kind: true, amount: true, category: true, via: true, fromPocket: true, fixedExpenseId: true },
    }),
  ]);

  let reservasEfectivo = 0;
  let reservasVirtual = 0;
  for (const r of reservas) {
    const monto = r._sum.amount ?? 0;
    // Una reserva sin forma de pago anotada se cobró a mano: efectivo.
    if (esEfectivo(r.paidVia)) reservasEfectivo += monto;
    else reservasVirtual += monto;
  }

  const c = clasificarLedger(movimientos);
  const ventasEfectivo = c.ventasEfectivo + reservasEfectivo;
  const ventasVirtual = c.ventasVirtual + reservasVirtual;

  return armarSaldo(
    [
      { concepto: "Ventas cobradas en mano", monto: ventasEfectivo },
      { concepto: "Lo que pusieron los socios", monto: c.aportesEfectivo },
      { concepto: "Pasado de la cuenta al cajón", monto: c.traspaso },
      { concepto: "Gastos pagados de la caja", monto: -c.gastosEfectivo },
      { concepto: "Retiros de los socios", monto: -c.retirosEfectivo },
      { concepto: "Diferencias de arqueo", monto: c.arqueoNeto },
    ],
    [
      { concepto: "Ventas cobradas por transferencia o tarjeta", monto: ventasVirtual },
      { concepto: "Lo que pusieron los socios", monto: c.aportesVirtual },
      { concepto: "Pasado al cajón", monto: -c.traspaso },
      { concepto: "Gastos pagados desde la cuenta", monto: -c.gastosVirtual },
      { concepto: "Retiros de los socios", monto: -c.retirosVirtual },
    ],
    ventasEfectivo + ventasVirtual,
  );
}

export { CATEGORIA_ARQUEO, CATEGORIA_TRASPASO };
