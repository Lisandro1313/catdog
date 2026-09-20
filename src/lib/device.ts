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
