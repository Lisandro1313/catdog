/**
 * Los productos de la casa (licores, envasados): la parte que también usa el formulario del teléfono.
 * Va aparte de `productos.ts` porque aquel habla con la base y no puede viajar al navegador.
 */

export const MAX_CANTIDAD = 24;
export const MAX_MENSAJE_PRODUCTO = 400;

/** "preparando" = todavía no está, se anota para cuando salga. "disponible" = ya se puede llevar. */
export type EstadoProducto = "preparando" | "disponible";

export type Producto = {
  nombre: string;
  /** "Botella de 500 ml", "Frasco de 350 g"… */
  presentacion: string;
  /** Precio en pesos. 0 = todavía no tiene precio: no se muestra. */
  precio: number;
  descripcion: string;
  estado: EstadoProducto;
};

/**
 * "Nombre | presentación | precio | descripción | estado" por renglón. Mismo formato de siempre.
 * El estado es "preparando" o "disponible"; si falta, se toma "preparando".
 */
export function parseProductosCasa(raw: string): Producto[] {
  return raw
    .split("\n")
    .map((renglon) => {
      const [nombre, presentacion, precio, descripcion, estado] = renglon.split("|");
      return {
        nombre: (nombre ?? "").trim(),
        presentacion: (presentacion ?? "").trim(),
        precio: Number((precio ?? "").replace(/\D/gu, "")) || 0,
        descripcion: (descripcion ?? "").trim(),
        estado: (estado ?? "").trim().toLowerCase().startsWith("disp") ? ("disponible" as const) : ("preparando" as const),
      };
    })
    .filter((p) => p.nombre.length > 0);
}

export const ESTADOS_PEDIDO = ["nuevo", "avisado", "entregado", "cancelado"] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];
export const ESTADO_PEDIDO_LABEL: Record<EstadoPedido, string> = {
  nuevo: "Nuevo",
  avisado: "Avisado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

/** Cuántas unidades pidieron de cada producto, sin contar los cancelados. Es lo que dice cuánto producir. */
export function demandaPorProducto(pedidos: { producto: string; cantidad: number; estado: string }[]): Map<string, { unidades: number; personas: number }> {
  const out = new Map<string, { unidades: number; personas: number }>();
  for (const p of pedidos) {
    if (p.estado === "cancelado") continue;
    const actual = out.get(p.producto) ?? { unidades: 0, personas: 0 };
    out.set(p.producto, { unidades: actual.unidades + p.cantidad, personas: actual.personas + 1 });
  }
  return out;
}
