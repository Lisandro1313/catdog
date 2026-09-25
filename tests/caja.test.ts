import { describe, expect, it } from "vitest";
import { calcularSaldo, diferenciaArqueo } from "../src/lib/caja-tipos";

/**
 * La caja es lo que hay en el cajón: entra lo cobrado en mano, sale lo pagado de la caja.
 * Lo que un socio paga de su bolsillo no toca la caja, aunque el negocio se lo deba.
 */
describe("calcularSaldo", () => {
  it("suma lo que entra y resta lo que sale", () => {
    const r = calcularSaldo([
      { concepto: "Cenas cobradas en mano", monto: 120000 },
      { concepto: "Gastos pagados de la caja", monto: -45000 },
    ]);
    expect(r.entra).toBe(120000);
    expect(r.sale).toBe(45000);
    expect(r.saldo).toBe(75000);
  });

  it("la caja puede quedar en rojo si se sacó de más", () => {
    const r = calcularSaldo([
      { concepto: "Cenas cobradas en mano", monto: 10000 },
      { concepto: "Retiros de los socios", monto: -30000 },
    ]);
    expect(r.saldo).toBe(-20000);
  });

  it("caja vacía", () => {
    const r = calcularSaldo([]);
    expect(r).toEqual({ saldo: 0, entra: 0, sale: 0, detalle: [] });
  });

  it("esconde las líneas en cero, para no ensuciar el detalle", () => {
    const r = calcularSaldo([
      { concepto: "Cenas cobradas en mano", monto: 50000 },
      { concepto: "Reservas pagadas en efectivo", monto: 0 },
      { concepto: "Retiros de los socios", monto: 0 },
    ]);
    expect(r.detalle).toEqual([{ concepto: "Cenas cobradas en mano", monto: 50000 }]);
    expect(r.saldo).toBe(50000);
  });

  it("una noche completa", () => {
    const r = calcularSaldo([
      { concepto: "Cenas cobradas en mano", monto: 300000 },
      { concepto: "Consumos cobrados en mano", monto: 45000 },
      { concepto: "Reservas pagadas en efectivo", monto: 40000 },
      { concepto: "Aportes de los socios", monto: 20000 },
      { concepto: "Gastos pagados de la caja", monto: -86000 },
      { concepto: "Retiros de los socios", monto: -100000 },
      { concepto: "Diferencias de arqueo", monto: -1000 },
    ]);
    expect(r.entra).toBe(405000);
    expect(r.sale).toBe(187000);
    expect(r.saldo).toBe(218000);
  });
});

describe("diferenciaArqueo", () => {
  it("cuadra: sin diferencia", () => {
    expect(diferenciaArqueo(218000, 218000)).toBe(0);
  });

  it("falta plata: diferencia negativa", () => {
    expect(diferenciaArqueo(215000, 218000)).toBe(-3000);
  });

  it("sobra plata: diferencia positiva", () => {
    expect(diferenciaArqueo(220000, 218000)).toBe(2000);
  });

  it("cajón vacío contra saldo esperado", () => {
    expect(diferenciaArqueo(0, 50000)).toBe(-50000);
  });
});
