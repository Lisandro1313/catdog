import { normalizeArPhone } from "./config";

/**
 * La parte de la lista de avisos que no habla con la base.
 * Va aparte de `avisos.ts` por lo mismo que `caja-rapida-tipos`: aquel importa Prisma y no puede
 * viajar al navegador ni probarse sin una base levantada.
 */

/** Un celular argentino sin 0, sin 15, sin 54 y sin 9: diez dígitos. Null si no llega a eso. */
export function normalizarTelefono(raw: string): string | null {
  const d = normalizeArPhone(raw);
  return d.length === 10 ? d : null;
}

/** Cómo se guarda de dónde salió: corto y comparable, porque después se agrupa por eso. */
export function limpiarOrigen(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]/gu, "").slice(0, 20);
}

export type Resultado = "nuevo" | "repetido" | "invalido";
