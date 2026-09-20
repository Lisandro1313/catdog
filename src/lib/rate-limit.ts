import { headers } from "next/headers";
import { createHash } from "node:crypto";

/**
 * Freno mínimo por IP, en memoria (por instancia): alcanza para que un formulario público
 * no se pueda martillar. Sin infraestructura: si la instancia se recicla, el contador arranca de cero.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function clientIpHash(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/** true si todavía se puede; false si esa IP ya hizo `max` pedidos de ese tipo en la ventana. */
export async function allowRequest(kind: string, max: number, windowMs = 15 * 60 * 1000): Promise<boolean> {
  return allowKey(`${kind}:${await clientIpHash()}`, max, windowMs);
}

/**
 * Igual, pero con una clave propia (p. ej. el deviceKey del teléfono). En la cena todos salen con la
 * misma IP del wifi de la casa, así que ahí el freno por IP no sirve: se frena por teléfono.
 */
export function allowKey(key: string, max: number, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    return true;
  }
  b.count += 1;
  return b.count <= max;
}
