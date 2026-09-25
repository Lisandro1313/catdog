import { prisma } from "./prisma";
import { parseBar, parseMenu } from "./menu";
import { costoReceta, type Insumo, type Unidad } from "./escandallo";
import { armarMatriz, type Matriz, type PlatoVendido } from "./matriz";

/**
 * Junta lo que se vendió de verdad con lo que cuesta cada cosa, y arma la matriz.
 *
 * Lo vendido sale de los consumos de las cuentas de la sala (lo que cada uno pidió con su teléfono)
 * y de la barra cobrada por mesa. Los pasos de la cena no entran: van adentro del cubierto, no se
 * eligen uno por uno, así que no tiene sentido preguntarse si "se piden".
 */
export async function getMatriz(desde: Date): Promise<Matriz> {
  const [consumos, barras, recetas, insumosRows, eventos] = await Promise.all([
    prisma.consumo.groupBy({
      by: ["item"],
      where: { status: { not: "cancelado" }, kind: { in: ["trago", "extra"] }, createdAt: { gte: desde } },
      _sum: { qty: true },
    }),
    prisma.barSale.groupBy({ by: ["item"], where: { qty: { gt: 0 }, updatedAt: { gte: desde } }, _sum: { qty: true } }),
    prisma.receta.findMany({ include: { items: true } }),
    prisma.insumo.findMany(),
    // Las cartas sirven para saber a cuánto se vende cada cosa cuando no hay receta con precio.
    prisma.event.findMany({ where: { date: { gte: desde } }, select: { menu: true, bar: true, barPrice: true } }),
  ]);

  // Cuántas veces se pidió cada cosa, junte los dos caminos por los que se cobra.
  const vendidos = new Map<string, number>();
  const sumar = (item: string, qty: number) => vendidos.set(item, (vendidos.get(item) ?? 0) + qty);
  for (const c of consumos) sumar(c.item, c._sum.qty ?? 0);
  for (const b of barras) sumar(b.item, b._sum.qty ?? 0);

  // A cuánto se vende cada cosa según las cartas del período.
  const precios = new Map<string, number>();
  for (const e of eventos) {
    for (const b of parseBar(e.bar)) {
      const precio = b.price ?? e.barPrice ?? 0;
      if (precio > 0) precios.set(b.name, precio);
    }
    for (const p of parseMenu(e.menu)) if (!precios.has(p.dish)) precios.set(p.dish, 0);
  }

  const insumos: Insumo[] = insumosRows.map((i) => ({ ...i, unidad: (["g", "ml", "u"].includes(i.unidad) ? i.unidad : "g") as Unidad }));

  // El costo por porción de cada receta, buscable por el nombre de la carta o por el suyo propio.
  const costos = new Map<string, number>();
  const preciosReceta = new Map<string, number>();
  for (const r of recetas) {
    const costo = costoReceta(
      { id: r.id, nombre: r.nombre, porciones: r.porciones, precioVenta: r.precioVenta, items: r.items.map((i) => ({ insumoId: i.insumoId, cantidad: i.cantidad, merma: i.merma })) },
      insumos,
    );
    for (const clave of [r.cartaItem, r.nombre]) {
      if (!clave) continue;
      costos.set(clave, costo.porPorcion);
      if (r.precioVenta && r.precioVenta > 0) preciosReceta.set(clave, r.precioVenta);
    }
  }

  const platos: PlatoVendido[] = [...vendidos.entries()].map(([nombre, cant]) => ({
    nombre,
    vendidos: cant,
    // Manda el precio de la carta; si no está, el que tenga la receta.
    precio: precios.get(nombre) ?? preciosReceta.get(nombre) ?? 0,
    costo: costos.has(nombre) ? Math.round(costos.get(nombre) as number) : null,
  }));

  return armarMatriz(platos);
}
