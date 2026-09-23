import { describe, expect, it } from "vitest";
import { pasosDe, resumen, type ConsumoRow, type CuentaRow } from "@/lib/sala-tipos";

const MENU = "Focaccia con manteca de tomate | Vermut de la casa\nArancini de osobuco | Sour de arroz\nFrutillas con crema | Espumante";

function consumo(over: Partial<ConsumoRow> & { kind: string; item: string }): ConsumoRow {
  return { id: Math.random().toString(36).slice(2), stepIndex: null, qty: 1, price: 0, status: "pendiente", createdAt: new Date(0), ...over };
}

function cuenta(over: Partial<CuentaRow> = {}): CuentaRow {
  const consumos = over.consumos ?? [];
  const extra = consumos.filter((c) => c.status !== "cancelado").reduce((n, c) => n + c.qty * c.price, 0);
  const coverPaid = over.coverPaid ?? true;
  const cover = over.cover ?? 40000;
  return {
    id: "c1",
    table: 3,
    name: "Nico",
    cover,
    coverNote: null,
    coverPaid,
    coverVia: over.coverVia ?? "efectivo",
    traspasoCode: null,
    abierta: coverPaid && !over.closedAt,
    openedAt: new Date(0),
    closedAt: null,
    consumos,
    extra,
    debe: (coverPaid ? 0 : cover) + (over.closedAt ? 0 : extra),
    ...over,
    ...(over.consumos ? { extra, debe: (coverPaid ? 0 : cover) + (over.closedAt ? 0 : extra) } : {}),
  };
}

describe("los pasos de la cena", () => {
  it("el plato y el trago de un paso se siguen por separado", () => {
    const pasos = pasosDe(MENU, [
      consumo({ kind: "maridaje", item: "Vermut de la casa", stepIndex: 1, status: "listo" }),
      consumo({ kind: "paso", item: "Focaccia con manteca de tomate", stepIndex: 1 }),
    ]);
    expect(pasos).toHaveLength(3);
    expect(pasos[0].trago).toBe("listo");
    expect(pasos[0].plato).toBe("pendiente");
    expect(pasos[1].plato).toBe("no");
    expect(pasos[1].trago).toBe("no");
  });

  it("lo cancelado no cuenta como pedido", () => {
    const pasos = pasosDe(MENU, [consumo({ kind: "paso", item: "Focaccia con manteca de tomate", stepIndex: 1, status: "cancelado" })]);
    expect(pasos[0].plato).toBe("no");
  });

  it("los nombres de los pasos siguen la carta", () => {
    const pasos = pasosDe(MENU, []);
    expect(pasos[0].label).toBe("Primer paso");
    expect(pasos[2].label).toBe("El postre");
  });
});

describe("los números de la noche", () => {
  it("la cena cobrada suma a la caja; la del invitado no", () => {
    const r = resumen([
      cuenta({ id: "a", name: "Nico", coverVia: "efectivo" }),
      cuenta({ id: "b", name: "Vero", cover: 0, coverVia: "invitado" }),
    ]);
    expect(r.cobradoCena).toBe(40000);
    expect(r.invitados).toBe(1);
    expect(r.personas).toBe(2);
  });

  it("lo de la barra recién cuenta cuando se cierra la cuenta", () => {
    const tragos = [consumo({ kind: "trago", item: "Negroni", price: 5000, status: "listo" })];
    const abierta = resumen([cuenta({ consumos: tragos })]);
    expect(abierta.cobradoConsumo).toBe(0);
    expect(abierta.porCobrar).toBe(5000);

    const cerrada = resumen([cuenta({ consumos: tragos, closedAt: new Date(0) })]);
    expect(cerrada.cobradoConsumo).toBe(5000);
    expect(cerrada.porCobrar).toBe(0);
  });

  it("la cuenta trabada figura como deuda de la cena", () => {
    const r = resumen([cuenta({ coverPaid: false, coverVia: null })]);
    expect(r.trabadas).toBe(1);
    expect(r.porCobrar).toBe(40000);
    expect(r.cobradoCena).toBe(0);
  });

  it("los pasos y sus maridajes no cuestan", () => {
    const r = resumen([
      cuenta({
        closedAt: new Date(0),
        consumos: [
          consumo({ kind: "paso", item: "Focaccia", stepIndex: 1, status: "listo" }),
          consumo({ kind: "maridaje", item: "Vermut de la casa", stepIndex: 1, status: "listo" }),
        ],
      }),
    ]);
    expect(r.cobradoConsumo).toBe(0);
  });
});
