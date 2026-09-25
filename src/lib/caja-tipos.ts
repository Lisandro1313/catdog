/**
 * La caja: la plata que el negocio cobró y todavía tiene.
 *
 * Dos reglas que la definen:
 * - A la caja entran **ventas**: cenas, barra, reservas, mercadería, lo que sea. La plata que un socio
 *   pone de su bolsillo NO entra: eso es una deuda del negocio con él, y se ve en "Entre socios".
 * - La plata se cuenta donde está: el billete en el cajón es una cosa y lo que está en la cuenta
 *   (transferencias, tarjeta, Mercado Pago) es otra. No se mezclan.
 *
 * Esto es lo puro, sin base de datos, para poder probarlo. Las consultas viven en `caja.ts`.
 */

/** Dónde está la plata. Lo que no es efectivo, está en la cuenta. */
export type Via = "efectivo" | "transferencia" | "tarjeta" | "mercadopago";

/** Los movimientos viejos no tienen forma de pago anotada: se toman como efectivo. */
export function esEfectivo(via: string | null | undefined): boolean {
  return via == null || via === "efectivo";
}

export const VIA_CAJA_LABEL: Record<Via, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  mercadopago: "Mercado Pago",
};

/** El rubro con el que se anota una diferencia de arqueo, para poder descontarla después. */
export const CATEGORIA_ARQUEO = "arqueo";

export type LineaCaja = {
  concepto: string;
  /** Positivo entra, negativo sale. */
  monto: number;
};

export type SaldoCaja = {
  /** Billetes en el cajón. */
  efectivo: number;
  /** Lo que está en la cuenta: transferencias, tarjeta, Mercado Pago. */
  virtual: number;
  /** Todo lo que tiene el negocio disponible. */
  total: number;
  /** Cuánto entró por ventas, en total. */
  ventas: number;
  detalleEfectivo: LineaCaja[];
  detalleVirtual: LineaCaja[];
};

function sumar(lineas: LineaCaja[]): number {
  return lineas.reduce((n, l) => n + l.monto, 0);
}

/** Arma el saldo a partir de las líneas de cada caja. */
export function armarSaldo(detalleEfectivo: LineaCaja[], detalleVirtual: LineaCaja[], ventas: number): SaldoCaja {
  const efectivo = sumar(detalleEfectivo);
  const virtual = sumar(detalleVirtual);
  return {
    efectivo,
    virtual,
    total: efectivo + virtual,
    ventas,
    detalleEfectivo: detalleEfectivo.filter((l) => l.monto !== 0),
    detalleVirtual: detalleVirtual.filter((l) => l.monto !== 0),
  };
}

/**
 * El arqueo: se cuenta la plata del cajón y se compara con lo que debería haber.
 * Positivo sobra, negativo falta. La diferencia se anota para que el saldo vuelva a cuadrar.
 */
export function diferenciaArqueo(contado: number, esperado: number): number {
  return Math.round(contado) - Math.round(esperado);
}

/** Un movimiento del libro, con lo poco que hace falta para saber si tocó la caja y cuál. */
export type MovimientoLedger = {
  kind: string;
  amount: number;
  category: string;
  via?: string | null;
  fromPocket?: boolean;
  /** Si viene de un gasto fijo, es un prorrateo semanal automático, no plata que se movió. */
  fixedExpenseId?: string | null;
};

/** El rubro de un pase entre cajas: sacar de la cuenta y guardarlo como billete. No es una venta. */
export const CATEGORIA_TRASPASO = "traspaso";

export type Clasificado = {
  ventasEfectivo: number;
  ventasVirtual: number;
  /** Plata que un socio dejó en la caja. Está ahí, aunque el negocio se la deba. */
  aportesEfectivo: number;
  aportesVirtual: number;
  gastosEfectivo: number;
  gastosVirtual: number;
  retirosEfectivo: number;
  retirosVirtual: number;
  arqueoNeto: number;
  /** Lo pasado de la cuenta al cajón: sale de virtual y entra a efectivo. */
  traspaso: number;
};

/**
 * Separa los movimientos del libro en lo que mueve cada caja.
 *
 * La diferencia que importa: la plata que un socio **deja en la caja** está en la caja (aunque el
 * negocio se la deba, y eso se ve en "Entre socios"). Lo que un socio **paga de su bolsillo** nunca
 * pasó por la caja, así que no la toca.
 *
 * Tampoco la tocan los gastos fijos prorrateados (alquiler, luz) que se cargan solos cada lunes:
 * son un apunte contable, no plata que se movió ese día.
 */
export function clasificarLedger(rows: MovimientoLedger[]): Clasificado {
  const r: Clasificado = {
    ventasEfectivo: 0,
    ventasVirtual: 0,
    aportesEfectivo: 0,
    aportesVirtual: 0,
    gastosEfectivo: 0,
    gastosVirtual: 0,
    retirosEfectivo: 0,
    retirosVirtual: 0,
    arqueoNeto: 0,
    traspaso: 0,
  };
  for (const m of rows) {
    const efvo = esEfectivo(m.via);
    if (m.category === CATEGORIA_ARQUEO) {
      // Sobraba: entra. Faltaba: sale. El arqueo es siempre del cajón.
      r.arqueoNeto += m.kind === "INCOME" ? m.amount : -m.amount;
      continue;
    }
    if (m.category === CATEGORIA_TRASPASO) {
      // Se anota una sola vez, como ingreso en efectivo: la plata cambia de lugar, no aparece.
      if (m.kind === "INCOME") r.traspaso += m.amount;
      continue;
    }
    if (m.kind === "CONTRIBUTION") {
      if (efvo) r.aportesEfectivo += m.amount;
      else r.aportesVirtual += m.amount;
      continue;
    }
    if (m.kind === "WITHDRAWAL") {
      if (efvo) r.retirosEfectivo += m.amount;
      else r.retirosVirtual += m.amount;
      continue;
    }
    if (m.kind === "INCOME") {
      if (efvo) r.ventasEfectivo += m.amount;
      else r.ventasVirtual += m.amount;
      continue;
    }
    if (m.kind === "EXPENSE") {
      // Del bolsillo de un socio o prorrateo automático: no se movió plata de la caja.
      if (m.fromPocket || m.fixedExpenseId) continue;
      if (efvo) r.gastosEfectivo += m.amount;
      else r.gastosVirtual += m.amount;
    }
  }
  return r;
}
