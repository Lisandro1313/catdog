import { describe, expect, it } from "vitest";
import { puntoDeEquilibrio, rankingGastos, rubrosQuePesan, serieSemanal } from "../src/lib/estadisticas";

describe("puntoDeEquilibrio", () => {
  it("cuenta con el margen, no con el precio entero", () => {
    // Cada cubierto deja 40.000 − 12.000 = 28.000 para pagar los fijos.
    const e = puntoDeEquilibrio({ fijosSemanales: 280000, precio: 40000, costoPorCubierto: 12000 });
    expect(e.margen).toBe(28000);
    expect(e.cubiertos).toBe(10);
    expect(e.facturacion).toBe(400000);
    expect(e.margenPorcentual).toBeCloseTo(70, 0);
  });

  it("redondea para arriba: medio cubierto no existe", () => {
    const e = puntoDeEquilibrio({ fijosSemanales: 100000, precio: 40000, costoPorCubierto: 12000 });
    expect(e.cubiertos).toBe(4);
  });

  it("si cada plato se vende a pérdida, no hay punto de equilibrio", () => {
    const e = puntoDeEquilibrio({ fijosSemanales: 280000, precio: 10000, costoPorCubierto: 12000 });
    expect(e.margen).toBeLessThan(0);
    expect(e.cubiertos).toBeNull();
    expect(e.facturacion).toBeNull();
  });

  it("vender justo al costo tampoco tiene punto de equilibrio", () => {
    const e = puntoDeEquilibrio({ fijosSemanales: 280000, precio: 12000, costoPorCubierto: 12000 });
    expect(e.cubiertos).toBeNull();
  });

  it("sin gastos fijos alcanza con vender uno", () => {
    const e = puntoDeEquilibrio({ fijosSemanales: 0, precio: 40000, costoPorCubierto: 12000 });
    expect(e.cubiertos).toBe(0);
  });

  it("precio en cero no rompe el porcentaje", () => {
    const e = puntoDeEquilibrio({ fijosSemanales: 1000, precio: 0, costoPorCubierto: 0 });
    expect(e.margenPorcentual).toBeNull();
  });
});

describe("rankingGastos", () => {
  const rubros = [
    { categoria: "carniceria", etiqueta: "Carnicería", monto: 180000, anterior: 120000 },
    { categoria: "verduleria", etiqueta: "Verdulería", monto: 60000, anterior: 60000 },
    { categoria: "bebidas", etiqueta: "Bebidas", monto: 90000 },
    { categoria: "vajilla", etiqueta: "Vajilla", monto: 0 },
  ];

  it("ordena de lo que más pesa a lo que menos", () => {
    const { filas, total } = rankingGastos(rubros);
    expect(total).toBe(330000);
    expect(filas.map((f) => f.etiqueta)).toEqual(["Carnicería", "Bebidas", "Verdulería"]);
  });

  it("saca los rubros en cero: no ensucian la lista", () => {
    const { filas } = rankingGastos(rubros);
    expect(filas.some((f) => f.etiqueta === "Vajilla")).toBe(false);
  });

  it("calcula qué parte del total se lleva cada uno", () => {
    const { filas } = rankingGastos(rubros);
    expect(filas[0].parte).toBeCloseTo(54.5, 1);
  });

  it("marca cuánto subió contra el período anterior", () => {
    const { filas } = rankingGastos(rubros);
    expect(filas.find((f) => f.etiqueta === "Carnicería")?.cambio).toBeCloseTo(50, 0);
    expect(filas.find((f) => f.etiqueta === "Verdulería")?.cambio).toBe(0);
  });

  it("sin período anterior no inventa una comparación", () => {
    const { filas } = rankingGastos(rubros);
    expect(filas.find((f) => f.etiqueta === "Bebidas")?.cambio).toBeNull();
  });

  it("sin gastos, total cero y sin filas", () => {
    expect(rankingGastos([])).toEqual({ filas: [], total: 0 });
  });
});

describe("rubrosQuePesan", () => {
  it("dice con cuántos rubros ya estás tocando la mayor parte", () => {
    const { filas } = rankingGastos([
      { categoria: "a", etiqueta: "A", monto: 600 },
      { categoria: "b", etiqueta: "B", monto: 300 },
      { categoria: "c", etiqueta: "C", monto: 100 },
    ]);
    const r = rubrosQuePesan(filas, 70);
    expect(r.cuantos).toBe(2);
    expect(r.parte).toBe(90);
  });

  it("lista vacía", () => {
    expect(rubrosQuePesan([], 70)).toEqual({ cuantos: 0, parte: 0 });
  });
});

describe("serieSemanal", () => {
  it("calcula el resultado de cada semana y la escala del gráfico", () => {
    const { puntos, maximo } = serieSemanal([
      { etiqueta: "1/9", ingresos: 500000, gastos: 300000 },
      { etiqueta: "8/9", ingresos: 200000, gastos: 460000 },
    ]);
    expect(puntos[0].resultado).toBe(200000);
    expect(puntos[1].resultado).toBe(-260000);
    // La escala toma el más grande en valor absoluto, así las barras se comparan entre sí.
    expect(maximo).toBe(260000);
  });

  it("sin semanas, escala cero y sin puntos", () => {
    expect(serieSemanal([])).toEqual({ puntos: [], maximo: 0 });
  });
});
