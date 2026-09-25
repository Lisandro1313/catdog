import { describe, expect, it } from "vitest";

/**
 * Prueba de humo de la consulta que arma la matriz: que cruce consumos, barra y recetas sin
 * romperse contra la base real. Se saltea sin DATABASE_URL, así los tests no dependen de la red.
 */
const url = process.env.DATABASE_URL;

describe.skipIf(!url)("getMatriz contra la base", { timeout: 30000 }, () => {
  it("responde con una matriz coherente", async () => {
    const { getMatriz } = await import("../src/lib/matriz-db");
    const m = await getMatriz(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
    expect(Array.isArray(m.filas)).toBe(true);
    expect(Array.isArray(m.sinDatos)).toBe(true);
    // El mix de todo lo clasificado tiene que dar 100 (o 0 si todavía no hay nada medible).
    const suma = m.filas.reduce((n, f) => n + f.mix, 0);
    expect(m.filas.length === 0 ? 0 : Math.round(suma)).toBe(m.filas.length === 0 ? 0 : 100);
    // Cada fila clasificada tiene costo, así que su margen es un número.
    for (const f of m.filas) expect(Number.isFinite(f.margen)).toBe(true);
  });
});
