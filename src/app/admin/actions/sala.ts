"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { argentinaDay } from "@/lib/dates";
import {
  COVER_VIAS,
  abrirTraspaso,
  cancelarTraspaso,
  cargarExtra,
  cerrarCuenta,
  desmarcarCover,
  getCuentas,
  marcarReserva,
  nuevoSalaCode,
  reabrirCuenta,
  resumen,
  saldarCover,
  setConsumoStatus,
  setCover,
  type CoverVia,
} from "@/lib/sala";
import { setServicioAbierto } from "@/lib/hoy";
import { requireAdmin, whoAmI } from "@/lib/admin-guard";

/**
 * La sala: lo que hace la casa durante el servicio. Cobrar la cena de cada uno, marcar lo que va
 * saliendo, cargar un extra, cerrar cuentas, pasarle la cuenta a otro teléfono, abrir el servicio y
 * cerrar la caja de la noche.
 */

// ---------- la sala: cuentas por persona, cobro y pedidos ----------

/** Cobra (o perdona) la cena de una cuenta: con eso se destraba y la persona puede pedir. */
export async function cobrarCenaAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const via = String(formData.get("via") ?? "");
  const montoRaw = String(formData.get("monto") ?? "").replace(/\D/g, "");
  if (!COVER_VIAS.includes(via as CoverVia)) return;
  try {
    await saldarCover(id, via as CoverVia, montoRaw ? Number(montoRaw) : undefined);
  } catch {
    // La cuenta ya no está (la borraron o es una pantalla vieja): no hay nada que hacer.
    return;
  }
  revalidatePath(`/admin/eventos/${eventId}/sala`);
}

/** La casa marca que esa cuenta corresponde a una reserva ya paga. */
export async function marcarReservaAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const reservationId = String(formData.get("reservationId") ?? "");
  try {
    await marcarReserva(id, reservationId);
  } catch {
    return;
  }
  revalidatePath(`/admin/eventos/${eventId}/sala`);
}

export async function desmarcarCenaAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  await desmarcarCover(id);
  revalidatePath(`/admin/eventos/${eventId}/sala`);
}

/** Cambia lo que le toca pagar por la cena: 2x1, descuento o el monto que sea. */
export async function setCoverAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  // Sin dígitos no se hace nada: ni el campo vacío ni un "cuarenta mil" pueden dejar la cena en cero.
  const digitos = String(formData.get("monto") ?? "").replace(/\D/g, "");
  if (!digitos) return;
  const monto = Number(digitos);
  const nota = String(formData.get("nota") ?? "").trim().slice(0, 40) || null;
  await setCover(id, monto, nota);
  revalidatePath(`/admin/eventos/${eventId}/sala`);
}

/** Marca un pedido como servido, o lo cancela. */
export async function consumoStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "pendiente" && status !== "listo" && status !== "cancelado") return;
  await setConsumoStatus(id, status);
  revalidatePath(`/admin/eventos/${eventId}/sala`);
  revalidatePath(`/admin/eventos/${eventId}/cocina`);
}

/** Carga algo a mano en una cuenta (una botella, un extra). */
export async function cargarExtraAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const item = String(formData.get("item") ?? "").trim();
  const price = Number(String(formData.get("price") ?? "").replace(/\D/g, "")) || 0;
  const qty = Math.max(1, Math.min(20, Number(formData.get("qty")) || 1));
  if (!item) return;
  try {
    await cargarExtra(id, item, price, qty);
  } catch {
    return;
  }
  revalidatePath(`/admin/eventos/${eventId}/sala`);
}

/** Cierra la cuenta: ya cobró todo lo que consumió. */
export async function cerrarCuentaAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const via = String(formData.get("via") ?? "efectivo");
  if (via !== "efectivo" && via !== "tarjeta" && via !== "transferencia" && via !== "invitado") return;
  try {
    await cerrarCuenta(id, via);
  } catch {
    return;
  }
  revalidatePath(`/admin/eventos/${eventId}/sala`);
}

export async function reabrirCuentaAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  await reabrirCuenta(id);
  revalidatePath(`/admin/eventos/${eventId}/sala`);
}

/** Habilita pasar una cuenta a otro teléfono: devuelve un código de un solo uso que dura 15 minutos. */
export async function abrirTraspasoAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  try {
    await abrirTraspaso(id);
  } catch {
    return;
  }
  revalidatePath(`/admin/eventos/${eventId}/sala`);
}

export async function cancelarTraspasoAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  await cancelarTraspaso(id);
  revalidatePath(`/admin/eventos/${eventId}/sala`);
}

export async function nuevoSalaCodeAction(formData: FormData) {
  await requireAdmin();
  const eventId = String(formData.get("eventId") ?? "");
  await nuevoSalaCode(eventId);
  revalidatePath(`/admin/eventos/${eventId}/sala`);
}

/**
 * Abre o cierra el servicio a mano. Con el servicio abierto, el QR de la casa (`/mesa`) y las mesitas
 * trabajan con esa función sin importar el día ni la hora: sirve para probar sin esperar a la noche y
 * para abrir una jornada suelta. Al cerrarlo vuelve a mandar el reloj.
 */
export async function abrirServicioAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const eventId = String(formData.get("eventId") ?? "");
  const abrir = formData.get("abrir") === "1";
  if (abrir && !eventId) return;
  await setServicioAbierto(abrir ? eventId : null);
  revalidatePath(`/admin/eventos/${eventId}/sala`);
  revalidatePath(`/admin/eventos/${eventId}`);
  revalidatePath("/admin");
  revalidatePath("/mesa");
}

/**
 * Cierra la caja de la sala: suma las cenas cobradas y lo consumido en las cuentas cerradas, y lo
 * carga como ingreso de la noche. Lo que se pagó por transferencia va igual: la plata entra después.
 */
export async function cerrarSalaAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const me = await whoAmI();
  const eventId = String(formData.get("eventId") ?? "");
  const cuentas = await getCuentas(eventId);
  const r = resumen(cuentas);
  const total = r.cobradoCena + r.cobradoConsumo;
  if (total <= 0) return;
  // Un asiento por forma de pago: así la caja sabe qué quedó en billete y qué en la cuenta.
  // Id fijo por cena y vía: dos toques a la vez (o los dos dueños) actualizan el mismo asiento.
  const dia = argentinaDay();
  for (const { via, total: monto } of r.porVia) {
    const detalle = `Sala: ${r.personas} personas (${r.invitados} de la casa), cobrado en ${via}`.slice(0, 200);
    await prisma.ledgerEntry.upsert({
      where: { id: `sala-${eventId}-${via}` },
      update: { amount: monto, description: detalle, via, updatedAt: new Date(), updatedBy: me.name, deletedAt: null },
      create: { id: `sala-${eventId}-${via}`, eventId, kind: "INCOME", category: "cena", description: detalle, amount: monto, via, day: dia, by: me.name, fromPocket: false, createdBy: me.name },
    });
  }
  // El asiento viejo juntaba todas las formas de pago en uno solo: se archiva para no contar doble.
  await prisma.ledgerEntry.updateMany({ where: { id: `sala-${eventId}`, deletedAt: null }, data: { deletedAt: new Date(), deletedBy: me.name } });
  revalidatePath(`/admin/eventos/${eventId}/sala`);
  revalidatePath("/admin/gastos");
}
