import { afterAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { costoReceta, type Insumo } from "../src/lib/escandallo";

/**
 * Prueba de humo contra la base real: que las tablas del escandallo existan, que se pueda cargar un
 * insumo y una receta, y que el costo que sale de la base sea el mismo que calcula la cuenta pura.
 * Todo lo que crea lleva el prefijo "zz-prueba" y se borra al terminar.
 */
const url = process.env.DATABASE_URL;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url ?? "" }) });
const MARCA = "zz-prueba-escandallo";

afterAll(async () => {
  await prisma.recetaItem.deleteMany({ where: { receta: { nombre: { startsWith: MARCA } } } });
  await prisma.receta.deleteMany({ where: { nombre: { startsWith: MARCA } } });
  await prisma.insumo.deleteMany({ where: { nombre: { startsWith: MARCA } } });
  await prisma.$disconnect();
});

describe.skipIf(!url)("escandallo contra la base", { timeout: 30000 }, () => {
  it("carga insumos y receta, y el costo coincide con la cuenta pura", async () => {
    const cebolla = await prisma.insumo.create({ data: { nombre: `${MARCA} cebolla`, unidad: "g", precio: 1200, cantidad: 1000, merma: 15 } });
    const bondiola = await prisma.insumo.create({ data: { nombre: `${MARCA} bondiola`, unidad: "g", precio: 9000, cantidad: 1000, merma: 20 } });

    const receta = await prisma.receta.create({
      data: {
        nombre: `${MARCA} bondiola braseada`,
        porciones: 4,
        precioVenta: 12000,
        items: { create: [{ insumoId: bondiola.id, cantidad: 800 }, { insumoId: cebolla.id, cantidad: 170 }] },
      },
      include: { items: true },
    });

    const insumos: Insumo[] = [cebolla, bondiola].map((i) => ({ ...i, unidad: "g" as const }));
    const costo = costoReceta(
      { id: receta.id, nombre: receta.nombre, porciones: receta.porciones, precioVenta: receta.precioVenta, items: receta.items },
      insumos,
    );

    // bondiola: 800/0,8 = 1000 g × $9 = 9000 · cebolla: 170/0,85 = 200 g × $1,2 = 240
    expect(costo.total).toBeCloseTo(9240, 0);
    expect(costo.porPorcion).toBeCloseTo(2310, 0);
    expect(costo.foodCost).toBeCloseTo(19.25, 1);
    expect(costo.detalle[0].nombre).toBe(`${MARCA} bondiola`);
  });

  it("no deja borrar un insumo que una receta está usando", async () => {
    const insumo = await prisma.insumo.create({ data: { nombre: `${MARCA} sal`, unidad: "g", precio: 500, cantidad: 500, merma: 0 } });
    await prisma.receta.create({ data: { nombre: `${MARCA} con sal`, porciones: 1, items: { create: [{ insumoId: insumo.id, cantidad: 5 }] } } });
    await expect(prisma.insumo.delete({ where: { id: insumo.id } })).rejects.toThrow();
  });

  it("el mismo insumo no entra dos veces en la misma receta", async () => {
    const insumo = await prisma.insumo.create({ data: { nombre: `${MARCA} aceite`, unidad: "ml", precio: 3000, cantidad: 1000, merma: 0 } });
    const receta = await prisma.receta.create({ data: { nombre: `${MARCA} dos veces`, porciones: 1 } });
    await prisma.recetaItem.create({ data: { recetaId: receta.id, insumoId: insumo.id, cantidad: 10 } });
    await expect(prisma.recetaItem.create({ data: { recetaId: receta.id, insumoId: insumo.id, cantidad: 20 } })).rejects.toThrow();
  });
});
