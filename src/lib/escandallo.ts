/**
 * El escandallo: cuánto cuesta de verdad un plato.
 *
 * La trampa del costeo casero es olvidarse de la merma. Si la receta lleva 170 g de cebolla limpia,
 * no comprás 170: comprás ~200, porque pelarla se lleva el 15%. Lo que se paga es el peso bruto, así
 * que el costo se calcula desde ahí. Sin eso, todos los platos parecen más baratos de lo que son.
 *
 * Todo esto es puro y sin base de datos, para poder probarlo. Las consultas viven en `recetas.ts`.
 */

/** En qué se mide un insumo. El precio siempre se carga como "tanto cuesta tanta cantidad". */
export type Unidad = "g" | "ml" | "u";

export const UNIDAD_LABEL: Record<Unidad, string> = {
  g: "gramos",
  ml: "mililitros",
  u: "unidades",
};

export type Insumo = {
  id: string;
  nombre: string;
  unidad: Unidad;
  /** Lo que salió la compra. */
  precio: number;
  /** Cuánto trae esa compra, en la unidad del insumo (1 kg de harina = 1000 g). */
  cantidad: number;
  /** Cuánto se pierde al limpiar o cocinar, de 0 a 100. La cebolla ronda 15; una botella, 0. */
  merma: number;
};

export type RecetaItem = {
  insumoId: string;
  /** Lo que va al plato, ya limpio, en la unidad del insumo. */
  cantidad: number;
  /** Merma propia de esta preparación. Si falta, vale la del insumo. */
  merma?: number | null;
};

export type Receta = {
  id: string;
  nombre: string;
  /** Cuántas porciones salen de la receta entera. */
  porciones: number;
  /** A cuánto se vende la porción. Sin esto no hay margen ni food cost. */
  precioVenta?: number | null;
  items: RecetaItem[];
};

/** Lo que cuesta una unidad del insumo (un gramo, un mililitro, una unidad). */
export function costoPorUnidad(insumo: Pick<Insumo, "precio" | "cantidad">): number {
  if (!(insumo.cantidad > 0)) return 0;
  return insumo.precio / insumo.cantidad;
}

/**
 * Cuánto hay que comprar para que quede `cantidad` limpia. Con 15% de merma, para 170 g limpios hay
 * que comprar 200. Una merma de 100% (o más) no tiene sentido: se trata como si no hubiera merma.
 */
export function pesoBruto(cantidad: number, merma: number): number {
  const m = Number.isFinite(merma) ? Math.min(Math.max(merma, 0), 99) : 0;
  return cantidad / (1 - m / 100);
}

/** Lo que cuesta ese ingrediente dentro de la receta, contando la merma. */
export function costoItem(item: RecetaItem, insumo: Insumo): number {
  const merma = item.merma ?? insumo.merma ?? 0;
  return pesoBruto(item.cantidad, merma) * costoPorUnidad(insumo);
}

export type CostoReceta = {
  /** Lo que cuesta la receta entera. */
  total: number;
  /** Lo que cuesta cada porción. Es el número que se compara contra el precio de venta. */
  porPorcion: number;
  /** Cuánto deja cada porción después de pagar la materia prima. */
  margen: number | null;
  /**
   * Qué parte del precio se va en materia prima, de 0 a 100. El estándar de la industria está entre
   * 28 y 36 según el tipo de servicio: más arriba, el plato se come la ganancia.
   */
  foodCost: number | null;
  /** El detalle, ordenado de lo que más pesa a lo que menos: por ahí se empieza a ajustar. */
  detalle: { insumoId: string; nombre: string; costo: number; parte: number }[];
};

/** El costo de una receta, con el detalle de qué ingrediente se lleva cuánto. */
export function costoReceta(receta: Receta, insumos: Insumo[]): CostoReceta {
  const porId = new Map(insumos.map((i) => [i.id, i]));
  const detalle: CostoReceta["detalle"] = [];
  let total = 0;
  for (const item of receta.items) {
    const insumo = porId.get(item.insumoId);
    // Un ingrediente que ya no está en la lista no suma: mejor quedarse corto que inventar un costo.
    if (!insumo) continue;
    const costo = costoItem(item, insumo);
    total += costo;
    detalle.push({ insumoId: insumo.id, nombre: insumo.nombre, costo, parte: 0 });
  }
  for (const d of detalle) d.parte = total > 0 ? (d.costo / total) * 100 : 0;
  detalle.sort((a, b) => b.costo - a.costo);

  const porciones = receta.porciones > 0 ? receta.porciones : 1;
  const porPorcion = total / porciones;
  const venta = receta.precioVenta ?? null;
  return {
    total,
    porPorcion,
    margen: venta != null && venta > 0 ? venta - porPorcion : null,
    foodCost: venta != null && venta > 0 ? (porPorcion / venta) * 100 : null,
    detalle,
  };
}

/**
 * A cuánto habría que vender la porción para que la materia prima sea ese porcentaje del precio.
 * Es la cuenta al revés del food cost: "si quiero estar en 30%, esto va a $X".
 */
export function precioSugerido(costoPorcion: number, foodCostObjetivo: number): number {
  if (!(foodCostObjetivo > 0)) return 0;
  return Math.round(costoPorcion / (foodCostObjetivo / 100));
}

/**
 * Dónde cae el food cost de un plato. Los límites salen del estándar de la industria (28–36%):
 * hasta 30 está cómodo, hasta 36 es lo normal, y de ahí para arriba hay que mirarlo.
 */
export function semaforoFoodCost(foodCost: number | null): "bien" | "justo" | "caro" | null {
  if (foodCost == null) return null;
  if (foodCost <= 30) return "bien";
  if (foodCost <= 36) return "justo";
  return "caro";
}
