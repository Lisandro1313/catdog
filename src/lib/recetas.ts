import { prisma } from "./prisma";
import { costoReceta, type CostoReceta, type Insumo, type Receta, type Unidad } from "./escandallo";

export * from "./escandallo";

/** Un insumo tal como sale de la base, con la unidad ya tipada. */
function armarInsumo(row: { id: string; nombre: string; unidad: string; precio: number; cantidad: number; merma: number }): Insumo {
  return { ...row, unidad: (["g", "ml", "u"].includes(row.unidad) ? row.unidad : "g") as Unidad };
}

export async function getInsumos() {
  const rows = await prisma.insumo.findMany({ orderBy: { nombre: "asc" } });
  return rows.map((r) => ({ ...armarInsumo(r), category: r.category, updatedAt: r.updatedAt }));
}

export type RecetaConCosto = Receta & { costo: CostoReceta; cartaItem: string | null; actualizada: Date };

/** Todas las recetas con su costo ya calculado, de la que más deja a la que menos. */
export async function getRecetas(): Promise<RecetaConCosto[]> {
  const [recetas, insumosRows] = await Promise.all([
    prisma.receta.findMany({ orderBy: { nombre: "asc" }, include: { items: true } }),
    prisma.insumo.findMany(),
  ]);
  const insumos = insumosRows.map(armarInsumo);
  return recetas.map((r) => {
    const receta: Receta = {
      id: r.id,
      nombre: r.nombre,
      porciones: r.porciones,
      precioVenta: r.precioVenta,
      items: r.items.map((i) => ({ insumoId: i.insumoId, cantidad: i.cantidad, merma: i.merma })),
    };
    return { ...receta, cartaItem: r.cartaItem, actualizada: r.updatedAt, costo: costoReceta(receta, insumos) };
  });
}

export async function getReceta(id: string): Promise<RecetaConCosto | null> {
  const [r, insumosRows] = await Promise.all([prisma.receta.findUnique({ where: { id }, include: { items: true } }), prisma.insumo.findMany()]);
  if (!r) return null;
  const insumos = insumosRows.map(armarInsumo);
  const receta: Receta = {
    id: r.id,
    nombre: r.nombre,
    porciones: r.porciones,
    precioVenta: r.precioVenta,
    items: r.items.map((i) => ({ insumoId: i.insumoId, cantidad: i.cantidad, merma: i.merma })),
  };
  return { ...receta, cartaItem: r.cartaItem, actualizada: r.updatedAt, costo: costoReceta(receta, insumos) };
}
