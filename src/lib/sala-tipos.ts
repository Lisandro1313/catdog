import { parseMenu } from "./menu";
import { labelForStep } from "./pasos";

/**
 * Tipos y reglas de la sala que también corren en el celular del invitado. Acá no se toca la base de
 * datos: lo que necesita Prisma vive en sala.ts, que re-exporta todo esto.
 */

export type CoverVia = "efectivo" | "transferencia" | "invitado" | "reserva";
export const COVER_VIAS: CoverVia[] = ["efectivo", "transferencia", "invitado", "reserva"];
export const VIA_LABEL: Record<CoverVia, string> = {
  efectivo: "efectivo",
  transferencia: "transferencia",
  invitado: "invitado de la casa",
  reserva: "ya lo pagó al reservar",
};

export type ConsumoRow = { id: string; kind: string; item: string; stepIndex: number | null; qty: number; price: number; status: string; createdAt: Date };
export type CuentaRow = {
  id: string;
  table: number;
  name: string;
  cover: number;
  coverNote: string | null;
  coverPaid: boolean;
  coverVia: string | null;
  abierta: boolean;
  openedAt: Date;
  closedAt: Date | null;
  consumos: ConsumoRow[];
  /** Lo consumido aparte de la cena (tragos y extras que no se cancelaron). */
  extra: number;
  /** Lo que falta cobrar: la cena si todavía no la pagó, más lo consumido. */
  debe: number;
};

export type EstadoPedido = "no" | "pendiente" | "listo";
export type CartaPaso = {
  index: number;
  label: string;
  dish: string;
  drink: string | null;
  /** El plato va a la cocina; el trago del maridaje, a la barra. Se piden por separado o juntos. */
  plato: EstadoPedido;
  trago: EstadoPedido;
};

/** El plato de un paso va como "paso"; el trago que lo acompaña, como "maridaje" (los dos sin costo). */
export const KIND_PLATO = "paso";
export const KIND_MARIDAJE = "maridaje";

function estado(consumos: ConsumoRow[], kind: string, index: number): EstadoPedido {
  const c = consumos.filter((x) => x.kind === kind && x.stepIndex === index && x.status !== "cancelado").at(-1);
  return !c ? "no" : c.status === "listo" ? "listo" : "pendiente";
}

/** Los pasos de la cena con el estado de esta cuenta: qué pidió de cada parte y qué ya le sirvieron. */
export function pasosDe(menu: string | null, consumos: ConsumoRow[]): CartaPaso[] {
  const steps = parseMenu(menu);
  return steps.map((s, i) => {
    const index = i + 1;
    return {
      index,
      label: labelForStep(index, s.dish, steps.length),
      dish: s.dish,
      drink: s.drink,
      plato: estado(consumos, KIND_PLATO, index),
      trago: estado(consumos, KIND_MARIDAJE, index),
    };
  });
}

