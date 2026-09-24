import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

export const DEVICE_COOKIE = "catdog_hoy_device";
const PATTERN = /^[a-f0-9-]{36}$/;

/** Identificador anónimo del teléfono en /hoy, emitido por el servidor en una cookie httpOnly (el cliente no lo elige). */
export async function ensureDeviceKey(): Promise<string> {
  const store = await cookies();
  const existing = store.get(DEVICE_COOKIE)?.value;
  if (existing && PATTERN.test(existing)) return existing;
  const key = randomUUID();
  store.set(DEVICE_COOKIE, key, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/hoy", maxAge: 60 * 60 * 24 * 90 });
  return key;
}

/** Solo lectura (para páginas, que no pueden setear cookies). */
export async function readDeviceKey(): Promise<string | null> {
  const v = (await cookies()).get(DEVICE_COOKIE)?.value;
  return v && PATTERN.test(v) ? v : null;
}

export const MESA_COOKIE = "catdog_mesa";

/**
 * Identificador del teléfono dentro de /mesa. Va aparte del de /hoy porque las cookies de aquel
 * están atadas a esa ruta; acá es la llave de la cuenta, así que no se puede perder al navegar.
 */
export async function ensureSalaKey(): Promise<string> {
  const store = await cookies();
  const existing = store.get(MESA_COOKIE)?.value;
  if (existing && PATTERN.test(existing)) return existing;
  const key = randomUUID();
  store.set(MESA_COOKIE, key, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/mesa", maxAge: 60 * 60 * 24 * 30 });
  return key;
}

export async function readSalaKey(): Promise<string | null> {
  const v = (await cookies()).get(MESA_COOKIE)?.value;
  return v && PATTERN.test(v) ? v : null;
}

export const FORO_COOKIE = "catdog_foro";

/**
 * Identificador del teléfono en la sobremesa. Va con path "/" (y no atado a una ruta como los otros)
 * porque a la charla se entra desde el home, desde /hoy y desde el link que alguien comparte.
 */
export async function ensureForoKey(): Promise<string> {
  const store = await cookies();
  const existing = store.get(FORO_COOKIE)?.value;
  if (existing && PATTERN.test(existing)) return existing;
  const key = randomUUID();
  store.set(FORO_COOKIE, key, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return key;
}

export async function readForoKey(): Promise<string | null> {
  const v = (await cookies()).get(FORO_COOKIE)?.value;
  return v && PATTERN.test(v) ? v : null;
}
