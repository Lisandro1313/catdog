/**
 * La parte de la caja que también usa la pantalla: formas de pago y tipos.
 * Va aparte de `caja-rapida.ts` porque aquel habla con la base y no puede viajar al navegador.
 */

export const VIAS = ["efectivo", "tarjeta", "transferencia"] as const;
export type Via = (typeof VIAS)[number];

export const VIA_LABEL: Record<Via, string> = {
  efectivo: "Efectivo",
  tarjeta: "Posnet",
  transferencia: "Transferencia",
};

/** Para los botones del celular, donde "Transferencia" no entra. */
export const VIA_CORTO: Record<Via, string> = {
  efectivo: "Efectivo",
  tarjeta: "Posnet",
  transferencia: "Transfer.",
};

export type Producto = { nombre: string; precio: number };
/** `partidaId` solo lo traen las líneas que salen de la mesa de juegos: sirve para marcarla cobrada. */
export type Item = { nombre: string; precio: number; cantidad: number; partidaId?: string };

/** "Nombre | precio" por linea, igual que la carta y los precios del cartel. */
export function parseProductos(raw: string): Producto[] {
  return raw
    .split("\n")
    .map((linea) => {
      const [nombre, precio] = linea.split("|");
      return { nombre: (nombre ?? "").trim(), precio: Number((precio ?? "").replace(/\D/gu, "")) };
    })
    .filter((p) => p.nombre.length > 0 && p.precio > 0);
}
