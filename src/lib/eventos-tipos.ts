import { formatPrice, normalizeArPhone } from "./config";

/**
 * Los eventos privados: tapeo para un grupo, con fecha pedida por ellos y presupuesto cerrado.
 * Esta parte es pura porque la usa también el formulario que corre en el teléfono.
 */

export const MAX_MENSAJE = 600;
export const MIN_PERSONAS = 4;
export const MAX_PERSONAS = 30;

export type Paquete = {
  /** "Los cinco", "La mesa larga"… lo que la casa quiera llamarle. */
  nombre: string;
  /** Hasta cuántas personas cubre. */
  hasta: number;
  /** Precio por persona. 0 = no se publica: se pasa por mensaje. */
  precio: number;
  /** Qué entra, separado por punto y coma. */
  incluye: string[];
};

/**
 * "Nombre | hasta | precio por persona | lo que incluye; separado; por punto y coma" por línea.
 * Mismo formato de siempre, para no aprender otro.
 */
export function parsePaquetes(raw: string): Paquete[] {
  return raw
    .split("\n")
    .map((linea) => {
      const [nombre, hasta, precio, incluye] = linea.split("|");
      return {
        nombre: (nombre ?? "").trim(),
        hasta: Number((hasta ?? "").replace(/\D/gu, "")),
        precio: Number((precio ?? "").replace(/\D/gu, "")),
        incluye: (incluye ?? "")
          .split(";")
          .map((x) => x.trim())
          .filter(Boolean),
      };
    })
    .filter((p) => p.nombre.length > 0 && p.hasta > 0)
    .sort((a, b) => a.hasta - b.hasta);
}

/** El paquete que le toca a un grupo de N personas: el primero que los cubra. */
export function paqueteParaS(paquetes: Paquete[], personas: number): Paquete | null {
  return paquetes.find((p) => personas <= p.hasta) ?? paquetes[paquetes.length - 1] ?? null;
}

/** Lo que sale el evento con ese paquete, sin la mesa ni lo que consuman de más. */
export function presupuestoBase(paquete: Paquete | null, personas: number): number {
  if (!paquete) return 0;
  return paquete.precio * Math.max(1, personas);
}

export const ESTADOS = ["consulta", "presupuestado", "confirmado", "hecho", "cancelado"] as const;
export type Estado = (typeof ESTADOS)[number];
export const ESTADO_LABEL: Record<Estado, string> = {
  consulta: "Consulta",
  presupuestado: "Presupuestado",
  confirmado: "Confirmado",
  hecho: "Hecho",
  cancelado: "Cancelado",
};

/** El presupuesto escrito como lo mandaría una persona, listo para WhatsApp. */
export function mensajePresupuesto(p: {
  nombre: string;
  personas: number;
  fecha: string;
  incluye: string[];
  total: number;
  sena: number;
  alias: string;
  titular: string;
}): string {
  const primerNombre = p.nombre.trim().split(/\s+/u)[0] ?? "";
  const lineas = [
    `¡Hola ${primerNombre}! Te paso el presupuesto para ${p.personas} personas (${p.fecha}):`,
    "",
    ...p.incluye.map((x) => `• ${x.charAt(0).toUpperCase()}${x.slice(1)}`),
    "",
    p.total > 0 ? `Total: ${formatPrice(p.total)} (${formatPrice(Math.round(p.total / Math.max(1, p.personas)))} por persona).` : "",
    "Lo que tomen de más se paga en la barra, al precio de siempre.",
    "",
    p.sena > 0 ? `Para tomar la fecha, la seña es de ${formatPrice(p.sena)}.` : "Para tomar la fecha se deja una seña.",
    p.alias ? `Alias: ${p.alias}${p.titular ? ` (a nombre de ${p.titular})` : ""}` : "",
    "Mandame el comprobante por acá y queda confirmado.",
  ];
  return lineas.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n").trim();
}

/** Link de WhatsApp si el contacto parece un celular argentino; si no (un mail, por ejemplo), null. */
export function waLink(contacto: string, texto: string): string | null {
  if (contacto.includes("@")) return null;
  const local = normalizeArPhone(contacto);
  if (local.length !== 10) return null;
  return `https://wa.me/549${local}?text=${encodeURIComponent(texto)}`;
}
