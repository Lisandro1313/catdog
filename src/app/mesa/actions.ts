"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ensureSalaKey, readSalaKey } from "@/lib/device";
import { getTonightEvent } from "@/lib/hoy";
import { allowKey, allowRequest } from "@/lib/rate-limit";
import { cleanName } from "@/lib/juegos";
import {
  abrirCuenta,
  cancelarMiConsumo,
  getCuentasEnTraspaso,
  getMisCuentas,
  tomarCuenta,
  pedirPaso,
  pedirTrago,
  saldarCover,
  SalaError,
  type CuentaRow,
} from "@/lib/sala";

/**
 * Lo que hace el invitado desde el QR de su mesa: abrir su cuenta, destrabarla con el código de la
 * noche si la casa se lo da, pedir los pasos y los tragos, y mirar lo que lleva.
 */

export type MesaResult = { ok: true; cuentas: CuentaRow[]; foco?: string } | { ok: false; error: string };

async function eventoDeHoy(eventId: string) {
  const tonight = await getTonightEvent();
  if (!tonight || tonight.id !== eventId) return null;
  return tonight;
}

/** Lo que este teléfono lleva ahora (para refrescar la pantalla). */
export async function misCuentasAction(eventId: string): Promise<CuentaRow[]> {
  const key = await readSalaKey();
  if (!key) return [];
  return getMisCuentas(eventId, key);
}

/** Las cuentas de esta mesa que la casa habilitó para pasar a otro teléfono. */
export async function cuentasEnTraspasoAction(eventId: string, table: number): Promise<{ id: string; name: string }[]> {
  if (!(await eventoDeHoy(eventId)) || !Number.isInteger(table)) return [];
  return getCuentasEnTraspaso(eventId, table);
}

const tomarSchema = z.object({ eventId: z.string().min(1), cuentaId: z.string().min(1), code: z.string().trim().max(8) });

/** Toma una cuenta de esta mesa en este teléfono, con el código de la noche. */
export async function tomarCuentaAction(input: unknown): Promise<MesaResult> {
  const parsed = tomarSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };
  const { eventId, cuentaId, code } = parsed.data;
  const event = await eventoDeHoy(eventId);
  if (!event) return { ok: false, error: "Esto funciona solo durante la cena." };
  const key = await ensureSalaKey();
  if (!allowKey(`tomar:${key}`, 8)) return { ok: false, error: "Probaste varias veces; pedile el código a la casa." };
  const dueña = await prisma.cuenta.findUnique({ where: { id: cuentaId }, select: { eventId: true } });
  if (!dueña || dueña.eventId !== eventId) return { ok: false, error: "Esa cuenta no es de esta cena." };
  try {
    await tomarCuenta(cuentaId, key, code);
  } catch (err) {
    return { ok: false, error: err instanceof SalaError ? err.message : "No se pudo tomar." };
  }
  return { ok: true, cuentas: await getMisCuentas(eventId, key), foco: cuentaId };
}

const abrirSchema = z.object({
  eventId: z.string().min(1),
  table: z.number().int().min(0).max(99),
  name: z.string().max(40),
  reservationId: z.string().nullable().optional(),
});

/** Abre la cuenta de una persona en una mesa. Queda trabada hasta que la casa cobre la cena. */
export async function abrirCuentaAction(input: unknown): Promise<MesaResult> {
  const parsed = abrirSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };
  const { eventId, table, reservationId } = parsed.data;
  const event = await eventoDeHoy(eventId);
  if (!event) return { ok: false, error: "Esto funciona solo durante la cena." };
  const name = cleanName(parsed.data.name);
  if (!name) return { ok: false, error: "Poné tu nombre." };
  const key = await ensureSalaKey();
  if (!allowKey(`cuenta:${key}`, 8) || !(await allowRequest("cuenta-ip", 200))) return { ok: false, error: "Esperá un momento." };
  try {
    const cuenta = await abrirCuenta({ eventId, table, name, deviceKey: key, reservationId: reservationId ?? null, price: event.price });
    return { ok: true, cuentas: await getMisCuentas(eventId, key), foco: cuenta.id };
  } catch (err) {
    return { ok: false, error: err instanceof SalaError ? err.message : "No se pudo abrir la cuenta." };
  }
}

type Mine = { key: string; error?: undefined } | { key?: undefined; error: string };

/** Que la cuenta sea de este teléfono: nadie toca la cuenta de otro. */
async function miCuentaOError(eventId: string, cuentaId: string): Promise<Mine> {
  const key = await readSalaKey();
  if (!key) return { error: "Abrí tu cuenta primero." };
  const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId }, select: { deviceKey: true, eventId: true } });
  if (!cuenta || cuenta.deviceKey !== key || cuenta.eventId !== eventId) return { error: "Esa cuenta no es de este teléfono." };
  return { key };
}

const codigoSchema = z.object({ eventId: z.string().min(1), cuentaId: z.string().min(1), code: z.string().trim().max(8) });

/**
 * La casa canta el código de la noche y el invitado lo escribe: así se destraba la cuenta sin que
 * nadie tenga que sacar el panel. Sirve para los invitados que no pagan y para el que ya pagó en mano.
 */
export async function codigoAction(input: unknown): Promise<MesaResult> {
  const parsed = codigoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Código inválido." };
  const { eventId, cuentaId, code } = parsed.data;
  const event = await eventoDeHoy(eventId);
  if (!event) return { ok: false, error: "Esto funciona solo durante la cena." };
  const mine = await miCuentaOError(eventId, cuentaId);
  if (mine.error !== undefined || mine.key === undefined) return { ok: false, error: mine.error ?? "Abrí tu cuenta primero." };
  if (!allowKey(`codigo:${mine.key}`, 10)) return { ok: false, error: "Probaste varias veces; pedile el código a la casa." };
  if (!event.salaCode || code !== event.salaCode) return { ok: false, error: "Ese código no es." };
  await saldarCover(cuentaId, "efectivo");
  return { ok: true, cuentas: await getMisCuentas(eventId, mine.key), foco: cuentaId };
}

const pasoSchema = z.object({ eventId: z.string().min(1), cuentaId: z.string().min(1), stepIndex: z.number().int().min(1).max(20), que: z.enum(["plato", "trago", "ambos"]) });

export async function pedirPasoAction(input: unknown): Promise<MesaResult> {
  const parsed = pasoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pedido inválido." };
  const { eventId, cuentaId, stepIndex, que } = parsed.data;
  if (!(await eventoDeHoy(eventId))) return { ok: false, error: "Esto funciona solo durante la cena." };
  const mine = await miCuentaOError(eventId, cuentaId);
  if (mine.error !== undefined || mine.key === undefined) return { ok: false, error: mine.error ?? "Abrí tu cuenta primero." };
  if (!allowKey(`paso:${mine.key}`, 30)) return { ok: false, error: "Esperá un momento." };
  try {
    await pedirPaso(cuentaId, stepIndex, que);
  } catch (err) {
    return { ok: false, error: err instanceof SalaError ? err.message : "No se pudo pedir." };
  }
  return { ok: true, cuentas: await getMisCuentas(eventId, mine.key), foco: cuentaId };
}

const tragoSchema = z.object({ eventId: z.string().min(1), cuentaId: z.string().min(1), item: z.string().trim().min(1).max(120), qty: z.number().int().min(1).max(4).optional() });

export async function pedirTragoAction(input: unknown): Promise<MesaResult> {
  const parsed = tragoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pedido inválido." };
  const { eventId, cuentaId, item, qty } = parsed.data;
  if (!(await eventoDeHoy(eventId))) return { ok: false, error: "Esto funciona solo durante la cena." };
  const mine = await miCuentaOError(eventId, cuentaId);
  if (mine.error !== undefined || mine.key === undefined) return { ok: false, error: mine.error ?? "Abrí tu cuenta primero." };
  if (!allowKey(`trago:${mine.key}`, 30)) return { ok: false, error: "Esperá un momento." };
  try {
    await pedirTrago(cuentaId, item, qty ?? 1);
  } catch (err) {
    return { ok: false, error: err instanceof SalaError ? err.message : "No se pudo pedir." };
  }
  return { ok: true, cuentas: await getMisCuentas(eventId, mine.key), foco: cuentaId };
}

export async function cancelarConsumoAction(eventId: string, consumoId: string): Promise<MesaResult> {
  const key = await readSalaKey();
  if (!key || typeof consumoId !== "string") return { ok: false, error: "No se pudo cancelar." };
  await cancelarMiConsumo(consumoId, key);
  return { ok: true, cuentas: await getMisCuentas(eventId, key) };
}
