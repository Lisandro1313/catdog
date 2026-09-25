import { describe, expect, it } from "vitest";
import { armarMatriz, resumenMatriz, type PlatoVendido } from "../src/lib/matriz";

/**
 * Cuatro platos armados a propósito para caer uno en cada lugar de la matriz.
 * Total vendido: 100. La vara de popularidad queda en 100/4 × 0,7 = 17,5%.
 */
const platos: PlatoVendido[] = [
  // Se pide mucho (40%) y deja mucho (8000) → estrella
  { nombre: "Bondiola", vendidos: 40, precio: 12000, costo: 4000 },
  // Se pide mucho (40%) y deja poco (2000) → caballo de tiro
  { nombre: "Tortilla", vendidos: 40, precio: 5000, costo: 3000 },
  // Casi no se pide (10%) y deja mucho (9000) → incógnita
  { nombre: "Langostinos", vendidos: 10, precio: 14000, costo: 5000 },
  // Casi no se pide (10%) y deja poco (1000) → perro
  { nombre: "Ensalada", vendidos: 10, precio: 4000, costo: 3000 },
];

describe("armarMatriz", () => {
  it("ubica cada plato donde le toca", () => {
    const m = armarMatriz(platos);
    const donde = Object.fromEntries(m.filas.map((f) => [f.nombre, f.lugar]));
    expect(donde).toEqual({
      Bondiola: "estrella",
      Tortilla: "caballo",
      Langostinos: "incognita",
      Ensalada: "perro",
    });
  });

  it("la vara de popularidad es el 70% de lo que le tocaría a cada uno", () => {
    const m = armarMatriz(platos);
    expect(m.corteMix).toBeCloseTo(17.5, 1);
  });

  it("la vara de ganancia pesa por lo vendido, no es un promedio simple", () => {
    const m = armarMatriz(platos);
    // (8000×40 + 2000×40 + 9000×10 + 1000×10) / 100 = 5000
    expect(m.corteMargen).toBe(5000);
    // El promedio simple de los márgenes daría 5000 también acá, así que probamos un caso donde difieren.
    const otro = armarMatriz([
      { nombre: "Caro poco pedido", vendidos: 1, precio: 100000, costo: 0 },
      { nombre: "Barato muy pedido", vendidos: 99, precio: 1000, costo: 0 },
    ]);
    // Pesado: (100000×1 + 1000×99) / 100 = 1990. El promedio simple sería 50500.
    expect(otro.corteMargen).toBe(1990);
  });

  it("ordena por la plata que deja en total", () => {
    const m = armarMatriz(platos);
    expect(m.filas[0].nombre).toBe("Bondiola");
    expect(m.filas[0].aporte).toBe(8000 * 40);
  });

  it("calcula el mix de cada uno", () => {
    const m = armarMatriz(platos);
    expect(m.filas.find((f) => f.nombre === "Bondiola")?.mix).toBeCloseTo(40, 1);
    expect(m.total).toBe(100);
  });

  it("un plato sin receta queda afuera y se avisa", () => {
    const m = armarMatriz([...platos, { nombre: "Postre sin receta", vendidos: 20, precio: 6000, costo: null }]);
    expect(m.sinDatos).toEqual(["Postre sin receta"]);
    expect(m.filas.some((f) => f.nombre === "Postre sin receta")).toBe(false);
    // Y no ensucia el total de los que sí se pueden medir.
    expect(m.total).toBe(100);
  });

  it("un plato sin precio de venta tampoco se puede ubicar", () => {
    const m = armarMatriz([{ nombre: "Sin precio", vendidos: 5, precio: 0, costo: 1000 }]);
    expect(m.filas).toEqual([]);
    expect(m.sinDatos).toEqual(["Sin precio"]);
  });

  it("lo que no se vendió ni se menciona", () => {
    const m = armarMatriz([{ nombre: "Nunca pedido", vendidos: 0, precio: 5000, costo: 1000 }]);
    expect(m.filas).toEqual([]);
    expect(m.sinDatos).toEqual([]);
  });

  it("carta vacía", () => {
    expect(armarMatriz([])).toEqual({ filas: [], total: 0, corteMix: 0, corteMargen: 0, sinDatos: [] });
  });

  it("un plato que se vende a pérdida cae abajo de la vara", () => {
    const m = armarMatriz([
      { nombre: "A pérdida", vendidos: 50, precio: 3000, costo: 5000 },
      { nombre: "Bien", vendidos: 50, precio: 12000, costo: 4000 },
    ]);
    expect(m.filas.find((f) => f.nombre === "A pérdida")?.margen).toBe(-2000);
    expect(m.filas.find((f) => f.nombre === "A pérdida")?.lugar).toBe("caballo");
  });
});

describe("resumenMatriz", () => {
  it("lo primero que avisa son los que no dejan ni se piden", () => {
    expect(resumenMatriz(armarMatriz(platos))).toContain("no deja");
  });

  it("sin filas no dice nada", () => {
    expect(resumenMatriz(armarMatriz([]))).toBeNull();
  });

  it("una carta pareja se reconoce", () => {
    const m = armarMatriz([
      { nombre: "Uno", vendidos: 50, precio: 10000, costo: 3000 },
      { nombre: "Dos", vendidos: 50, precio: 10000, costo: 3000 },
    ]);
    expect(resumenMatriz(m)).toContain("equilibrada");
  });
});
