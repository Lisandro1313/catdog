import { describe, expect, it } from "vitest";
import { armarSaldo, clasificarLedger, diferenciaArqueo, esEfectivo } from "../src/lib/caja-tipos";

/**
 * La caja es la caja fuerte del negocio: la plata cobrada que todavía está, separada en billete
 * (efectivo) y cuenta (transferencias, tarjeta, Mercado Pago).
 *
 * La diferencia que más importa: lo que un socio DEJA en la caja está en la caja; lo que un socio
 * PAGA de su bolsillo nunca pasó por ahí.
 */
describe("esEfectivo", () => {
  it("lo viejo sin forma de pago se toma como efectivo", () => {
    expect(esEfectivo(null)).toBe(true);
    expect(esEfectivo(undefined)).toBe(true);
  });

  it("distingue billete de cuenta", () => {
    expect(esEfectivo("efectivo")).toBe(true);
    expect(esEfectivo("transferencia")).toBe(false);
    expect(esEfectivo("tarjeta")).toBe(false);
    expect(esEfectivo("mercadopago")).toBe(false);
  });
});

describe("clasificarLedger", () => {
  it("la plata que un socio deja en la caja, está en la caja", () => {
    const r = clasificarLedger([{ kind: "CONTRIBUTION", amount: 125000, category: "otros", via: "efectivo" }]);
    expect(r.aportesEfectivo).toBe(125000);
  });

  it("lo que un socio paga de su bolsillo no toca la caja", () => {
    const r = clasificarLedger([{ kind: "EXPENSE", amount: 40000, category: "carniceria", fromPocket: true }]);
    expect(r.gastosEfectivo).toBe(0);
    expect(r.gastosVirtual).toBe(0);
  });

  it("el prorrateo semanal de un gasto fijo no saca plata de ningún lado", () => {
    const r = clasificarLedger([
      { kind: "EXPENSE", amount: 436155, category: "alquiler", fromPocket: false, fixedExpenseId: "fx1" },
      { kind: "EXPENSE", amount: 8000, category: "verduleria", fromPocket: false },
    ]);
    expect(r.gastosEfectivo).toBe(8000);
  });

  it("una venta suelta de cualquier día entra como venta", () => {
    // Ocho botellas de licor casero, una vendida un martes al mediodía.
    const r = clasificarLedger([{ kind: "INCOME", amount: 15000, category: "mercaderia", via: "efectivo" }]);
    expect(r.ventasEfectivo).toBe(15000);
  });

  it("separa las ventas según dónde quedó la plata", () => {
    const r = clasificarLedger([
      { kind: "INCOME", amount: 100000, category: "cena", via: "efectivo" },
      { kind: "INCOME", amount: 30000, category: "cena", via: "transferencia" },
      { kind: "INCOME", amount: 20000, category: "barra", via: "tarjeta" },
    ]);
    expect(r.ventasEfectivo).toBe(100000);
    expect(r.ventasVirtual).toBe(50000);
  });

  it("pasar plata de la cuenta al cajón no inventa una venta", () => {
    const r = clasificarLedger([{ kind: "INCOME", amount: 10000, category: "traspaso", via: "efectivo" }]);
    expect(r.traspaso).toBe(10000);
    expect(r.ventasEfectivo).toBe(0);
    expect(r.ventasVirtual).toBe(0);
  });

  it("el arqueo suma si sobraba y resta si faltaba", () => {
    expect(clasificarLedger([{ kind: "INCOME", amount: 2000, category: "arqueo" }]).arqueoNeto).toBe(2000);
    expect(clasificarLedger([{ kind: "EXPENSE", amount: 3000, category: "arqueo" }]).arqueoNeto).toBe(-3000);
  });

  it("los retiros salen de donde se sacaron", () => {
    const r = clasificarLedger([
      { kind: "WITHDRAWAL", amount: 50000, category: "otros", via: "efectivo" },
      { kind: "WITHDRAWAL", amount: 20000, category: "otros", via: "transferencia" },
    ]);
    expect(r.retirosEfectivo).toBe(50000);
    expect(r.retirosVirtual).toBe(20000);
  });
});

describe("armarSaldo", () => {
  it("la caja del ejemplo: 125 mil que dejó un socio y 10 mil de venta virtual", () => {
    const s = armarSaldo(
      [{ concepto: "Lo que pusieron los socios", monto: 125000 }],
      [{ concepto: "Ventas cobradas por transferencia o tarjeta", monto: 10000 }],
      10000,
    );
    expect(s.efectivo).toBe(125000);
    expect(s.virtual).toBe(10000);
    expect(s.total).toBe(135000);
  });

  it("esconde las líneas en cero", () => {
    const s = armarSaldo([{ concepto: "Ventas cobradas en mano", monto: 50000 }, { concepto: "Retiros de los socios", monto: 0 }], [], 50000);
    expect(s.detalleEfectivo).toEqual([{ concepto: "Ventas cobradas en mano", monto: 50000 }]);
  });

  it("caja vacía", () => {
    const s = armarSaldo([], [], 0);
    expect(s).toEqual({ efectivo: 0, virtual: 0, total: 0, ventas: 0, detalleEfectivo: [], detalleVirtual: [] });
  });

  it("una noche entera", () => {
    const s = armarSaldo(
      [
        { concepto: "Ventas cobradas en mano", monto: 300000 },
        { concepto: "Lo que pusieron los socios", monto: 125000 },
        { concepto: "Gastos pagados de la caja", monto: -86000 },
        { concepto: "Retiros de los socios", monto: -100000 },
      ],
      [{ concepto: "Ventas cobradas por transferencia o tarjeta", monto: 40000 }],
      340000,
    );
    expect(s.efectivo).toBe(239000);
    expect(s.virtual).toBe(40000);
    expect(s.total).toBe(279000);
  });
});

describe("diferenciaArqueo", () => {
  it("cuadra, falta y sobra", () => {
    expect(diferenciaArqueo(218000, 218000)).toBe(0);
    expect(diferenciaArqueo(215000, 218000)).toBe(-3000);
    expect(diferenciaArqueo(220000, 218000)).toBe(2000);
  });
});
