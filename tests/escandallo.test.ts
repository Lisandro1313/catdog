import { describe, expect, it } from "vitest";
import { costoItem, costoPorUnidad, costoReceta, pesoBruto, precioSugerido, semaforoFoodCost, type Insumo } from "../src/lib/escandallo";

const cebolla: Insumo = { id: "ceb", nombre: "Cebolla", unidad: "g", precio: 1200, cantidad: 1000, merma: 15 };
const bondiola: Insumo = { id: "bon", nombre: "Bondiola", unidad: "g", precio: 9000, cantidad: 1000, merma: 20 };
const pan: Insumo = { id: "pan", nombre: "Pan", unidad: "u", precio: 4000, cantidad: 10, merma: 0 };

describe("costoPorUnidad", () => {
  it("precio de la compra dividido lo que trae", () => {
    expect(costoPorUnidad({ precio: 1200, cantidad: 1000 })).toBeCloseTo(1.2);
    expect(costoPorUnidad({ precio: 4000, cantidad: 10 })).toBe(400);
  });

  it("cantidad en cero no rompe ni divide por cero", () => {
    expect(costoPorUnidad({ precio: 1200, cantidad: 0 })).toBe(0);
  });
});

describe("pesoBruto", () => {
  it("sin merma, bruto es igual a neto", () => {
    expect(pesoBruto(200, 0)).toBe(200);
  });

  it("con 15% de merma hay que comprar más de lo que va al plato", () => {
    // Para 170 g limpios hay que comprar 200.
    expect(pesoBruto(170, 15)).toBeCloseTo(200, 0);
  });

  it("una merma imposible no se lleva puesto el cálculo", () => {
    expect(pesoBruto(100, 100)).toBe(pesoBruto(100, 99));
    expect(pesoBruto(100, -5)).toBe(100);
  });
});

describe("costoItem", () => {
  it("cobra el peso bruto, no el que va al plato", () => {
    // 170 g limpios de cebolla = 200 g comprados × $1,2 = $240
    expect(costoItem({ insumoId: "ceb", cantidad: 170 }, cebolla)).toBeCloseTo(240, 0);
  });

  it("la merma de la receta le gana a la del insumo", () => {
    const sinMerma = costoItem({ insumoId: "ceb", cantidad: 100, merma: 0 }, cebolla);
    expect(sinMerma).toBeCloseTo(120, 5);
  });
});

describe("costoReceta", () => {
  const receta = {
    id: "r1",
    nombre: "Bondiola braseada",
    porciones: 4,
    precioVenta: 12000,
    items: [
      { insumoId: "bon", cantidad: 800 },
      { insumoId: "ceb", cantidad: 170 },
      { insumoId: "pan", cantidad: 4 },
    ],
  };

  it("suma los ingredientes y reparte por porción", () => {
    const r = costoReceta(receta, [cebolla, bondiola, pan]);
    // bondiola: 800/0,8 = 1000 g × $9 = 9000 · cebolla: 200 g × $1,2 = 240 · pan: 4 × $400 = 1600
    expect(r.total).toBeCloseTo(10840, 0);
    expect(r.porPorcion).toBeCloseTo(2710, 0);
  });

  it("calcula margen y food cost contra el precio de venta", () => {
    const r = costoReceta(receta, [cebolla, bondiola, pan]);
    expect(r.margen).toBeCloseTo(12000 - 2710, 0);
    expect(r.foodCost).toBeCloseTo(22.58, 1);
  });

  it("sin precio de venta no inventa margen ni food cost", () => {
    const r = costoReceta({ ...receta, precioVenta: null }, [cebolla, bondiola, pan]);
    expect(r.margen).toBeNull();
    expect(r.foodCost).toBeNull();
  });

  it("ordena el detalle por lo que más pesa", () => {
    const r = costoReceta(receta, [cebolla, bondiola, pan]);
    expect(r.detalle.map((d) => d.nombre)).toEqual(["Bondiola", "Pan", "Cebolla"]);
    expect(r.detalle[0].parte).toBeCloseTo(83, 0);
  });

  it("un ingrediente que ya no existe se saltea, no inventa costo", () => {
    const r = costoReceta({ ...receta, items: [{ insumoId: "fantasma", cantidad: 100 }] }, [cebolla]);
    expect(r.total).toBe(0);
    expect(r.detalle).toEqual([]);
  });

  it("porciones en cero no divide por cero", () => {
    const r = costoReceta({ ...receta, porciones: 0 }, [cebolla, bondiola, pan]);
    expect(Number.isFinite(r.porPorcion)).toBe(true);
    expect(r.porPorcion).toBeCloseTo(r.total, 5);
  });

  it("receta vacía", () => {
    const r = costoReceta({ id: "x", nombre: "vacía", porciones: 1, items: [] }, []);
    expect(r.total).toBe(0);
    expect(r.detalle).toEqual([]);
  });
});

describe("precioSugerido", () => {
  it("cuenta al revés: a cuánto vender para quedar en el food cost buscado", () => {
    expect(precioSugerido(2710, 30)).toBe(9033);
    expect(precioSugerido(3000, 25)).toBe(12000);
  });

  it("objetivo inválido no devuelve infinito", () => {
    expect(precioSugerido(2710, 0)).toBe(0);
  });
});

describe("semaforoFoodCost", () => {
  it("usa el estándar de la industria", () => {
    expect(semaforoFoodCost(22)).toBe("bien");
    expect(semaforoFoodCost(30)).toBe("bien");
    expect(semaforoFoodCost(34)).toBe("justo");
    expect(semaforoFoodCost(41)).toBe("caro");
  });

  it("sin precio de venta no hay semáforo", () => {
    expect(semaforoFoodCost(null)).toBeNull();
  });
});
