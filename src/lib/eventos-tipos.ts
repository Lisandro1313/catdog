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
  /** De qué línea es: la de tapeo, la simple… Vacío = la de siempre. */
  linea: string;
};

/** El nombre de la línea cuando no se escribió: lo que había antes de que hubiera dos. */
export const LINEA_POR_DEFECTO = "Con tapeo";

/**
 * "Nombre | hasta | precio por persona | lo que incluye; separado; por punto y coma | línea"
 * por renglón. La línea es opcional y sirve para ofrecerle dos cosas distintas al mismo grupo: la de
 * tapeo y una más barata. Sin escribirla, el paquete cae en la de siempre.
 */
export function parsePaquetes(raw: string): Paquete[] {
  return raw
    .split("\n")
    .map((renglon) => {
      const [nombre, hasta, precio, incluye, linea] = renglon.split("|");
      return {
        nombre: (nombre ?? "").trim(),
        hasta: Number((hasta ?? "").replace(/\D/gu, "")),
        precio: Number((precio ?? "").replace(/\D/gu, "")),
        incluye: (incluye ?? "")
          .split(";")
          .map((x) => x.trim())
          .filter(Boolean),
        linea: (linea ?? "").trim() || LINEA_POR_DEFECTO,
      };
    })
    .filter((p) => p.nombre.length > 0 && p.hasta > 0)
    .sort((a, b) => a.hasta - b.hasta);
}

/** Las líneas que hay, en el orden en que aparecen. Con una sola, no hay nada que elegir. */
export function lineasDe(paquetes: Paquete[]): string[] {
  const vistas: string[] = [];
  for (const p of paquetes) if (!vistas.includes(p.linea)) vistas.push(p.linea);
  return vistas;
}

/**
 * El paquete que le toca a un grupo de N personas: el primero de esa línea que los cubra. Si el
 * grupo es más grande que todos, va el más grande de la línea.
 */
export function paqueteParaS(paquetes: Paquete[], personas: number, linea?: string): Paquete | null {
  const deLaLinea = linea ? paquetes.filter((p) => p.linea === linea) : paquetes;
  const lista = deLaLinea.length > 0 ? deLaLinea : paquetes;
  return lista.find((p) => personas <= p.hasta) ?? lista[lista.length - 1] ?? null;
}

/**
 * Cómo se anota un paquete en un pedido. Lleva la línea adelante porque las dos líneas usan los
 * mismos nombres de grupo ("Los pocos" con tapeo y "Los pocos" con sánguches): sin la línea no se
 * sabría cuál eligió, y se le terminaría cotizando el precio del otro.
 */
export function claveDe(p: Paquete): string {
  return `${p.linea} · ${p.nombre}`;
}

/** El paquete que quedó anotado en un pedido. Entiende la clave nueva y el nombre suelto de antes. */
export function paquetePorNombre(paquetes: Paquete[], anotado: string | null): Paquete | null {
  if (!anotado) return null;
  const porClave = paquetes.find((p) => claveDe(p) === anotado);
  if (porClave) return porClave;
  // Pedidos viejos, de cuando había una sola línea: ahí el nombre alcanzaba.
  return paquetes.find((p) => p.nombre === anotado) ?? null;
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
