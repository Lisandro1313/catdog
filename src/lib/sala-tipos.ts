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

export type CartaPaso = { index: number; label: string; dish: string; drink: string | null; pedido: "no" | "pendiente" | "listo" };

/** Los pasos de la cena con el estado de esta cuenta: qué ya pidió y qué ya le sirvieron. */
export function pasosDe(menu: string | null, consumos: ConsumoRow[]): CartaPaso[] {
  const steps = parseMenu(menu);
  return steps.map((s, i) => {
    const index = i + 1;
    const c = consumos.filter((x) => x.kind === "paso" && x.stepIndex === index && x.status !== "cancelado").at(-1);
    return {
      index,
      label: labelForStep(index, s.dish, steps.length),
      dish: s.dish,
      drink: s.drink,
      pedido: !c ? "no" : c.status === "listo" ? "listo" : "pendiente",
    };
  });
}

