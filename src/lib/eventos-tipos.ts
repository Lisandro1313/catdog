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
