/**
 * La caja de efectivo: la plata física que hay en el local ahora mismo.
 *
 * No es el resultado del negocio (eso es "Plata en el negocio", que mezcla transferencias y tarjeta).
 * Acá entra solo lo que se cobró en mano y sale solo lo que se pagó de la caja, para que el número
 * coincida con lo que se cuenta al abrir el cajón.
 *
 * Esto es lo puro, sin base de datos, para poder probarlo. Las consultas viven en `caja.ts`.
 */

/** Lo que mueve la caja, con su signo. Sirve para mostrar el detalle y para el arqueo. */
export type MovimientoCaja = {
  concepto: string;
  /** Positivo entra, negativo sale. */
  monto: number;
};

export type SaldoCaja = {
  /** Lo que debería haber en el cajón ahora. */
  saldo: number;
  entra: number;
  sale: number;
  detalle: MovimientoCaja[];
};

/** El rubro con el que se anota una diferencia de arqueo, para poder descontarla después. */
export const CATEGORIA_ARQUEO = "arqueo";

/** Suma los movimientos y arma el saldo. */
export function calcularSaldo(detalle: MovimientoCaja[]): SaldoCaja {
  let entra = 0;
  let sale = 0;
  for (const m of detalle) {
    if (m.monto >= 0) entra += m.monto;
    else sale += -m.monto;
  }
  return { saldo: entra - sale, entra, sale, detalle: detalle.filter((m) => m.monto !== 0) };
}

/**
 * El arqueo: se cuenta la plata del cajón y se compara con lo que debería haber.
 * Positivo sobra, negativo falta. La diferencia se anota para que el saldo vuelva a cuadrar.
 */
export function diferenciaArqueo(contado: number, esperado: number): number {
  return Math.round(contado) - Math.round(esperado);
}
