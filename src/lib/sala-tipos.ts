import { parseMenu } from "./menu";
import { labelForStep } from "./pasos";

/**
 * Tipos y reglas de la sala que también corren en el celular del invitado. Acá no se toca la base de
 * datos: lo que necesita Prisma vive en sala.ts, que re-exporta todo esto.
 */

/*
 * Por ahora no hay mesas numeradas: son quince personas y la casa las conoce. Las cuentas guardan
 * `table: 0` ("sin mesa") y en pantalla no se muestra. Si algún día hacen falta, el número ya viaja
 * en la base y en todas las pantallas: solo hay que volver a pedirlo al abrir la cuenta.
 */

export type CoverVia = "efectivo" | "tarjeta" | "transferencia" | "invitado" | "reserva" | "codigo";
export const COVER_VIAS: CoverVia[] = ["efectivo", "tarjeta", "transferencia", "invitado", "reserva", "codigo"];
export const VIA_LABEL: Record<CoverVia, string> = {
  efectivo: "efectivo",
  tarjeta: "tarjeta",
  transferencia: "transferencia",
  invitado: "invitado de la casa",
  reserva: "ya lo pagó al reservar",
  codigo: "destrabada con el código",
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
  closedVia: string | null;
  /** Código de un solo uso si la casa habilitó pasar la cuenta a otro teléfono. */
  traspasoCode: string | null;
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

export type Resumen = {
  abiertas: number;
  trabadas: number;
  /** Se destrabaron con el código: falta confirmar cómo pagaron. */
  aConfirmar: number;
  cerradas: number;
  personas: number;
  cobradoCena: number;
  cobradoConsumo: number;
  porCobrar: number;
  invitados: number;
  /** Por forma de pago, para contar la caja al final. */
  porVia: { via: string; total: number }[];
};

/** Los números de la noche: lo cobrado, lo que falta y cómo entró. */
export function resumen(cuentas: CuentaRow[]): Resumen {
  const porVia = new Map<string, number>();
  let cobradoCena = 0;
  let cobradoConsumo = 0;
  let porCobrar = 0;
  let invitados = 0;
  for (const c of cuentas) {
    // "codigo" es una cuenta destrabada a mano: la plata no se cuenta hasta saber cómo pagó.
    if (c.coverPaid && c.coverVia && !["invitado", "reserva", "codigo"].includes(c.coverVia)) {
      cobradoCena += c.cover;
      porVia.set(c.coverVia, (porVia.get(c.coverVia) ?? 0) + c.cover);
    }
    // En una jornada nadie paga cubierto: eso no los vuelve invitados de la casa.
    const sinCubierto = c.coverNote === "sin cubierto";
    if (!sinCubierto && (c.coverVia === "invitado" || (c.cover === 0 && c.coverVia !== "reserva"))) invitados += 1;
    // Lo de la barra entra a la caja cuando la cuenta se cierra, salvo que se haya regalado.
    if (c.closedAt && c.closedVia !== "invitado") {
      cobradoConsumo += c.extra;
      if (c.extra > 0) porVia.set(c.closedVia ?? "consumo", (porVia.get(c.closedVia ?? "consumo") ?? 0) + c.extra);
    }
    // Lo destrabado con el código figura como pendiente de confirmar, no como cobrado.
    porCobrar += c.debe + (c.coverVia === "codigo" && !c.closedAt ? c.cover : 0);
  }
  return {
    abiertas: cuentas.filter((c) => c.abierta).length,
    trabadas: cuentas.filter((c) => !c.coverPaid && !c.closedAt).length,
    aConfirmar: cuentas.filter((c) => c.coverVia === "codigo" && !c.closedAt).length,
    cerradas: cuentas.filter((c) => c.closedAt).length,
    personas: cuentas.length,
    cobradoCena,
    cobradoConsumo,
    porCobrar,
    invitados,
    porVia: [...porVia].map(([via, total]) => ({ via, total })).sort((a, b) => b.total - a.total),
  };
}
