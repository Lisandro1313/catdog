"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  checkMaster,
  clearSession,
  getSession,
  hashPassword,
  isAdmin,
  setSession,
  verifyPassword,
  verifyUser,
} from "@/lib/admin-auth";
import { argentinaDay, parseArgentinaLocal } from "@/lib/dates";
import { PARTNERS } from "@/lib/ledger-categories";
import { storeReceipt } from "@/lib/receipts";
import { ensureFixedEntries, refreshCurrentWeekEntry, weeklyAmount } from "@/lib/fixed-expenses";
import { formatPrice, siteUrl } from "@/lib/config";
import { addPhoto, movePhoto, removePhoto } from "@/lib/photos";
import { renderReservationConfirmed, sendNewEventBlast, sendReminder, sendReservationCancelled, sendReviewRequests } from "@/lib/email";
import { isEmailConfigured, sendMail } from "@/lib/mailer";
import { icsFor } from "@/lib/calendar";
import { duplicateWeekLater } from "@/lib/events";
import { setPaymentConfig } from "@/lib/payment";
import { notifyWaitlist } from "@/lib/waitlist";
import { allowRequest } from "@/lib/rate-limit";
import { ReservationError, cancelReservation, chooseSeats, createManualReservation, markPaid } from "@/lib/reservations";
import { runAnalysis } from "@/lib/ai-analysis";
import { approveHuella, markSugerenciasSeen, removeHuella, removeSugerencia, setPedidoStatus, setServedStep } from "@/lib/vivo";
import { COVER_VIAS, abrirTraspaso, cancelarTraspaso, cargarExtra, cerrarCuenta, desmarcarCover, getCuentas, nuevoSalaCode, reabrirCuenta, resumen, saldarCover, setConsumoStatus, setCover, type CoverVia } from "@/lib/sala";

export type ActionState = { ok: boolean; message?: string } | null;

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** Quién está usando el panel. Con la contraseña maestra el nombre lo elige en cada formulario. */
async function whoAmI(): Promise<{ name: string; role: "master" | "user" }> {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const user = String(formData.get("user") ?? "").trim();
  // Diez intentos cada 15 minutos por IP, y medio segundo de espera tras cada fallo.
  if (!(await allowRequest("login", 10))) return { ok: false, message: "Demasiados intentos. Esperá unos minutos." };
  const fail = async () => {
    await new Promise((r) => setTimeout(r, 500));
    console.warn("[admin] login fallido", user || "(maestra)");
    return { ok: false as const, message: "Contraseña incorrecta." };
  };
  if (user) {
    if (!(await verifyUser(user, password))) return fail();
    await setSession({ name: user, role: "user" });
  } else {
    if (!checkMaster(password)) return fail();
    await setSession({ name: "Admin", role: "master" });
  }
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------

const passwordRule = z.string().min(6, "La contraseña tiene que tener al menos 6 caracteres.").max(100);

/** Crear usuario: requiere la contraseña maestra. */
export async function createUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const master = String(formData.get("master") ?? "");
  if (!name || name.length > 40) return { ok: false, message: "Poné un nombre." };
  const pw = passwordRule.safeParse(password);
  if (!pw.success) return { ok: false, message: pw.error.issues[0]?.message };
  if (!checkMaster(master)) return { ok: false, message: "La contraseña maestra no es correcta." };
  const exists = await prisma.user.findUnique({ where: { name } });
  if (exists) return { ok: false, message: "Ya existe un usuario con ese nombre." };
  await prisma.user.create({ data: { name, passwordHash: hashPassword(password) } });
  revalidatePath("/admin/ajustes");
  return { ok: true, message: `Usuario ${name} creado.` };
}

/** Cambiar la contraseña de otro usuario: requiere la contraseña maestra. */
export async function resetUserPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const master = String(formData.get("master") ?? "");
  const pw = passwordRule.safeParse(password);
  if (!pw.success) return { ok: false, message: pw.error.issues[0]?.message };
  if (!checkMaster(master)) return { ok: false, message: "La contraseña maestra no es correcta." };
  const user = await prisma.user.findUnique({ where: { name } });
  if (!user) return { ok: false, message: "Usuario inexistente." };
  await prisma.user.update({ where: { name }, data: { passwordHash: hashPassword(password) } });
  revalidatePath("/admin/ajustes");
  return { ok: true, message: `Contraseña de ${name} cambiada.` };
}

/** Cambiar mi propia contraseña: requiere la actual. */
export async function changeOwnPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await whoAmI();
  if (me.role !== "user") return { ok: false, message: "Entraste con la maestra: esa se cambia en Vercel." };
  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const pw = passwordRule.safeParse(password);
  if (!pw.success) return { ok: false, message: pw.error.issues[0]?.message };
  const user = await prisma.user.findUnique({ where: { name: me.name } });
  if (!user || !verifyPassword(current, user.passwordHash)) return { ok: false, message: "La contraseña actual no es correcta." };
  await prisma.user.update({ where: { name: me.name }, data: { passwordHash: hashPassword(password) } });
  return { ok: true, message: "Contraseña cambiada." };
}

/** Borrar usuario: requiere la contraseña maestra. */
export async function deleteUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const master = String(formData.get("master") ?? "");
  if (!checkMaster(master)) return { ok: false, message: "La contraseña maestra no es correcta." };
  await prisma.user.deleteMany({ where: { name } });
  revalidatePath("/admin/ajustes");
  return { ok: true, message: `Usuario ${name} borrado.` };
}

const eventSchema = z.object({
  title: z.string().trim().min(2, "Poné un título.").max(120, "El título es muy largo (máximo 120)."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Fecha inválida"),
  price: z.coerce.number({ message: "Precio inválido." }).int().min(0, "Precio inválido."),
  capacity: z.coerce.number({ message: "Capacidad inválida." }).int().min(1, "Capacidad inválida.").max(200, "Capacidad inválida."),
  description: z.string().trim().max(2000, "La descripción es muy larga (máximo 2000).").optional(),
  menu: z.string().trim().max(4000, "La carta es muy larga (máximo 4000).").optional(),
  bar: z.string().trim().max(4000, "La barra es muy larga (máximo 4000).").optional(),
  barPrice: z.coerce.number({ message: "Precio de barra inválido." }).int().min(0, "Precio de barra inválido.").optional(),
  address: z.string().trim().max(200, "La dirección es muy larga (máximo 200).").optional(),
  recipeGift: z.string().trim().max(6000, "La receta es muy larga (máximo 6000 caracteres).").optional(),
  published: z.boolean(),
  unlisted: z.boolean(),
});

function readEventForm(formData: FormData) {
  return eventSchema.safeParse({
    title: formData.get("title"),
    date: formData.get("date"),
    price: formData.get("price"),
    capacity: formData.get("capacity"),
    description: formData.get("description") || undefined,
    menu: formData.get("menu") || undefined,
    bar: formData.get("bar") || undefined,
    barPrice: formData.get("barPrice") || undefined,
    address: formData.get("address") || undefined,
    recipeGift: formData.get("recipeGift") || undefined,
    published: formData.get("published") === "on",
    unlisted: formData.get("unlisted") === "on",
  });
}

export async function createEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = readEventForm(formData);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const d = parsed.data;
  const event = await prisma.event.create({
    data: {
      title: d.title,
      date: parseArgentinaLocal(d.date),
      price: d.price,
      capacity: d.capacity,
      description: d.description ?? null,
      menu: d.menu ?? null,
      bar: d.bar ?? null,
      barPrice: d.barPrice ?? null,
      address: d.address ?? null,
      recipeGift: d.recipeGift ?? null,
      published: d.published,
      unlisted: d.unlisted,
    },
  });
  revalidatePath("/");
  redirect(`/admin/eventos/${event.id}`);
}

export async function updateEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = readEventForm(formData);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const d = parsed.data;

  const [taken, paid] = await Promise.all([
    prisma.seat.aggregate({ where: { eventId: id }, _max: { number: true } }),
    prisma.reservation.aggregate({ where: { eventId: id, status: "PAID" }, _sum: { quantity: true } }),
  ]);
  if (taken._max.number && taken._max.number > d.capacity) {
    return { ok: false, message: `Hay un lugar ${taken._max.number} reservado; no podés bajar la capacidad a ${d.capacity}.` };
  }
  if ((paid._sum.quantity ?? 0) > d.capacity) {
    return { ok: false, message: `Ya hay ${paid._sum.quantity} lugares pagos; no podés bajar la capacidad a ${d.capacity}.` };
  }

  await prisma.event.update({
    where: { id },
    data: {
      title: d.title,
      date: parseArgentinaLocal(d.date),
      price: d.price,
      capacity: d.capacity,
      description: d.description ?? null,
      menu: d.menu ?? null,
      bar: d.bar ?? null,
      barPrice: d.barPrice ?? null,
      address: d.address ?? null,
      recipeGift: d.recipeGift ?? null,
      published: d.published,
      unlisted: d.unlisted,
    },
  });
  revalidatePath("/");
  revalidatePath(`/admin/eventos/${id}`);
  return { ok: true, message: "Guardado." };
}

export async function deleteEventAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const paid = await prisma.reservation.count({ where: { eventId: id, status: "PAID" } });
  if (paid > 0) {
    // No borramos eventos con gente que pagó: se despublica.
    await prisma.event.update({ where: { id }, data: { published: false } });
  } else {
    await prisma.event.delete({ where: { id } });
  }
  revalidatePath("/");
  redirect("/admin");
}

/** Copia la cena a la misma hora de la semana siguiente (sin publicar) para revisarla y publicarla. */
export async function duplicateEventAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const copy = await duplicateWeekLater(id);
  if (!copy) redirect("/admin");
  redirect(`/admin/eventos/${copy.id}?copiada=1`);
}

export async function notifySubscribersAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return { ok: false, message: "Evento inexistente." };
  const subs = await prisma.subscriber.findMany({ select: { email: true } });
  if (subs.length === 0) return { ok: false, message: "No hay suscriptores todavía." };
  if (!isEmailConfigured()) return { ok: false, message: "Los mails no están configurados (ver Ajustes → Estado de los servicios)." };

  const { sent, failed } = await sendNewEventBlast({ emails: subs.map((s) => s.email), event });
  await prisma.event.update({ where: { id }, data: { notifiedAt: new Date() } });
  revalidatePath(`/admin/eventos/${id}`);
  return {
    ok: failed === 0,
    message: failed === 0 ? `Aviso enviado a ${sent} persona(s).` : `Enviados ${sent}, fallaron ${failed}. Mirá los logs.`,
  };
}

export async function markPaidAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const via = String(formData.get("via") ?? "efectivo");
  const r = await prisma.reservation.findUnique({ where: { id }, select: { eventId: true, status: true, name: true, email: true } });
  if (!r) return { ok: false, message: "Reserva inexistente." };
  if (r.status === "PAID") return { ok: true, message: "Ya estaba paga." };
  try {
    await markPaid(id, via);
  } catch (err) {
    if (err instanceof ReservationError) return { ok: false, message: err.message };
    throw err;
  }
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/eventos/${r.eventId}`);
  return { ok: true, message: r.email.endsWith("@local") ? `${r.name}: pagado. (Sin mail: pasale la dirección vos.)` : `${r.name}: pagado. Le sale el mail con la dirección.` };
}

export async function cancelReservationAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const r = await prisma.reservation.findUnique({ where: { id }, include: { event: true } });
  if (!r) return;
  await cancelReservation(id);
  // Solo avisamos a quien había pagado (una pendiente que se cancela no necesita mail).
  if (r.status === "PAID") {
    await sendReservationCancelled({ to: r.email, name: r.name, event: r.event, quantity: r.quantity, amount: r.amount }).catch(() => {});
  }
  notifyWaitlist(r.eventId).catch((err) => console.error("[waitlist] aviso falló", err));
  revalidatePath("/");
  revalidatePath(`/admin/eventos/${r.eventId}`);
}

const manualSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().max(120),
  phone: z.string().trim().max(40),
  quantity: z.coerce.number().int().min(1).max(50),
  seats: z.string().trim(),
  via: z.string().trim().min(1),
});

function parseSeatList(text: string): number[] {
  return Array.from(
    new Set(
      text
        .split(/[,\s]+/)
        .map((s) => parseInt(s, 10))
        .filter((n) => Number.isInteger(n) && n > 0),
    ),
  ).sort((a, b) => a - b);
}

/** Carga a mano una reserva ya pagada (efectivo, transferencia, invitado). Las sillas son opcionales. */
export async function manualReservationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = manualSchema.safeParse({
    eventId: formData.get("eventId"),
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    quantity: formData.get("quantity") || 1,
    seats: formData.get("seats") ?? "",
    via: formData.get("via") ?? "efectivo",
  });
  if (!parsed.success) return { ok: false, message: "Completá nombre y cantidad." };
  const d = parsed.data;
  try {
    await createManualReservation({
      eventId: d.eventId,
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      quantity: d.quantity,
      seats: parseSeatList(d.seats),
      via: d.via,
    });
  } catch (err) {
    if (err instanceof ReservationError) return { ok: false, message: err.message };
    throw err;
  }
  revalidatePath("/");
  revalidatePath(`/admin/eventos/${d.eventId}`);
  return { ok: true, message: `Reserva cargada para ${d.name}.` };
}

/** Asigna (o cambia) las sillas de una reserva pagada desde el panel. */
export async function assignSeatsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const seats = parseSeatList(String(formData.get("seats") ?? ""));
  const r = await prisma.reservation.findUnique({ where: { id }, select: { eventId: true } });
  if (!r) return { ok: false, message: "Reserva inexistente." };
  try {
    await chooseSeats(id, seats);
  } catch (err) {
    if (err instanceof ReservationError) return { ok: false, message: err.message };
    throw err;
  }
  revalidatePath("/");
  revalidatePath(`/admin/eventos/${r.eventId}`);
  return { ok: true, message: "Lugares asignados." };
}

/** Borra una reserva definitivamente (libera sillas y cupo). Para pruebas o devoluciones ya resueltas. */
export async function deleteReservationAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const r = await prisma.reservation.findUnique({ where: { id }, select: { eventId: true } });
  if (!r) return;
  await prisma.reservation.delete({ where: { id } });
  notifyWaitlist(r.eventId).catch((err) => console.error("[waitlist] aviso falló", err));
  revalidatePath("/");
  revalidatePath(`/admin/eventos/${r.eventId}`);
}

const ledgerSchema = z.object({
  eventId: z.string().min(1).optional(),
  kind: z.enum(["INCOME", "EXPENSE", "CONTRIBUTION", "WITHDRAWAL"]),
  category: z.string().trim().max(40).optional(),
  description: z.string().trim().max(200).optional(),
  amount: z.coerce.number().int().min(1),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  by: z.string().trim().max(40).optional(),
  fromPocket: z.enum(["si", "no"]).optional(),
});

export type LedgerActionState = { ok: boolean; message?: string; savedAt?: number } | null;

export async function addLedgerEntryAction(_prev: LedgerActionState, formData: FormData): Promise<LedgerActionState> {
  await requireAdmin();
  const parsed = ledgerSchema.safeParse({
    eventId: formData.get("eventId") || undefined,
    kind: formData.get("kind"),
    category: formData.get("category") || undefined,
    description: formData.get("description") || undefined,
    amount: formData.get("amount"),
    day: formData.get("day") || undefined,
    by: formData.get("by") || undefined,
    fromPocket: formData.get("fromPocket") || undefined,
  });
  if (!parsed.success) return { ok: false, message: "Revisá el monto y el rubro." };
  const d = parsed.data;
  const me = await whoAmI();
  const needsCategory = d.kind === "INCOME" || d.kind === "EXPENSE";
  if (needsCategory && !d.category) return { ok: false, message: "Elegí un rubro." };
  // Con usuario propio, el movimiento se firma con ese nombre; con la maestra, con el que eligió.
  const by = me.role === "user" ? me.name : d.by && PARTNERS.includes(d.by) ? d.by : (d.by ?? null);
  if (!needsCategory && !by) return { ok: false, message: "Elegí el socio." };
  // El día llega como "2026-09-11" (fecha argentina) y se guarda como fecha sin hora.
  const day = d.day ? new Date(`${d.day}T00:00:00Z`) : argentinaDay();

  const entry = await prisma.ledgerEntry.create({
    data: {
      eventId: d.eventId ?? null,
      kind: d.kind,
      category: needsCategory ? (d.category as string) : "socio",
      description: d.description ?? null,
      amount: d.amount,
      day,
      by,
      // Un gasto pagado "de la caja" no genera deuda con el socio.
      fromPocket: d.kind === "EXPENSE" ? d.fromPocket !== "no" : true,
      createdBy: me.name,
    },
  });

  // Comprobante (foto), opcional. Si falla la subida, el movimiento queda igual y se avisa.
  const receipt = formData.get("receipt");
  let receiptWarning = "";
  if (receipt instanceof File && receipt.size > 0) {
    try {
      const url = await storeReceipt(entry.id, receipt);
      await prisma.ledgerEntry.update({ where: { id: entry.id }, data: { receiptUrl: url } });
    } catch (err) {
      console.error("[comprobante] subida falló", err);
      receiptWarning = " La foto no se pudo subir; podés agregarla después desde el movimiento.";
    }
  }
  if (d.eventId) revalidatePath(`/admin/eventos/${d.eventId}`);
  revalidatePath("/admin/gastos");
  revalidatePath("/admin");
  const label = { INCOME: "Ingreso", EXPENSE: "Gasto", CONTRIBUTION: "Aporte", WITHDRAWAL: "Retiro" }[d.kind];
  return { ok: true, message: `${label} cargado.${receiptWarning}`, savedAt: Date.now() };
}

function revalidateLedger(eventId: string | null) {
  if (eventId) revalidatePath(`/admin/eventos/${eventId}`);
  revalidatePath("/admin/gastos");
  revalidatePath("/admin");
}

/** Borrado suave: va a la papelera y se puede restaurar. */
export async function deleteLedgerEntryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await whoAmI();
  const id = String(formData.get("id") ?? "");
  const e = await prisma.ledgerEntry.findUnique({ where: { id }, select: { eventId: true, deletedAt: true } });
  if (!e) return { ok: false, message: "Ese movimiento ya no existe." };
  if (e.deletedAt) return { ok: false, message: "Ya estaba en la papelera." };
  await prisma.ledgerEntry.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: me.name } });
  revalidateLedger(e.eventId);
  return { ok: true, message: "Movimiento enviado a la papelera." };
}

export async function restoreLedgerEntryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await whoAmI();
  const id = String(formData.get("id") ?? "");
  const e = await prisma.ledgerEntry.findUnique({ where: { id }, select: { eventId: true } });
  if (!e) return { ok: false, message: "Ese movimiento ya no existe." };
  await prisma.ledgerEntry.update({ where: { id }, data: { deletedAt: null, deletedBy: null } });
  revalidateLedger(e.eventId);
  return { ok: true, message: "Movimiento restaurado." };
}

const editSchema = z.object({
  id: z.string().min(1),
  category: z.string().trim().max(40).optional(),
  description: z.string().trim().max(200).optional(),
  amount: z.coerce.number().int().min(1),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  by: z.string().trim().max(40).optional(),
  fromPocket: z.enum(["si", "no"]).optional(),
});

export async function updateLedgerEntryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await whoAmI();
  const parsed = editSchema.safeParse({
    id: formData.get("id"),
    category: formData.get("category") || undefined,
    description: formData.get("description") || undefined,
    amount: formData.get("amount"),
    day: formData.get("day"),
    by: formData.get("by") || undefined,
    fromPocket: formData.get("fromPocket") || undefined,
  });
  if (!parsed.success) return { ok: false, message: "Revisá el monto y la fecha." };
  const d = parsed.data;
  const e = await prisma.ledgerEntry.findUnique({ where: { id: d.id } });
  if (!e || e.deletedAt) return { ok: false, message: "Ese movimiento no está disponible." };
  const isMoney = e.kind === "INCOME" || e.kind === "EXPENSE";
  if (isMoney && !d.category) return { ok: false, message: "Elegí un rubro." };

  await prisma.ledgerEntry.update({
    where: { id: d.id },
    data: {
      category: isMoney ? (d.category as string) : e.category,
      description: d.description ?? null,
      amount: d.amount,
      day: new Date(`${d.day}T00:00:00Z`),
      by: d.by ?? e.by,
      fromPocket: e.kind === "EXPENSE" ? d.fromPocket !== "no" : e.fromPocket,
      updatedAt: new Date(),
      updatedBy: me.name,
    },
  });

  const receipt = formData.get("receipt");
  if (receipt instanceof File && receipt.size > 0) {
    try {
      const url = await storeReceipt(e.id, receipt);
      await prisma.ledgerEntry.update({ where: { id: e.id }, data: { receiptUrl: url } });
    } catch (err) {
      console.error("[comprobante] subida falló", err);
      revalidateLedger(e.eventId);
      return { ok: true, message: "Guardado, pero la foto no se pudo subir." };
    }
  }
  revalidateLedger(e.eventId);
  return { ok: true, message: "Movimiento guardado." };
}

/** Colchón que se guarda en la caja antes de repartir (opcional). */
export async function setReserveAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const n = parseInt(String(formData.get("reserve") ?? "").replace(/\D/g, ""), 10);
  if (!Number.isFinite(n) || n < 0) return { ok: false, message: "Poné un número." };
  await prisma.setting.upsert({ where: { key: "reserve" }, update: { value: String(n) }, create: { key: "reserve", value: String(n) } });
  revalidatePath("/admin/gastos");
  return { ok: true, message: "Reserva guardada." };
}

/** Genera el análisis con los números actuales y lo guarda (por reglas o con IA, según lo configurado). */
export async function runAnalysisAction(): Promise<ActionState> {
  await requireAdmin();
  try {
    const r = await runAnalysis();
    revalidatePath("/admin/gastos");
    return r.note ? { ok: true, message: r.note } : { ok: true, message: "Análisis actualizado." };
  } catch (err) {
    console.error("[análisis] falló", err);
    return { ok: false, message: "No pude generar el análisis. Probá de nuevo en un rato." };
  }
}

// ---------------------------------------------------------------------------
// Gastos fijos (mensuales, prorrateados por semana)
// ---------------------------------------------------------------------------

const fixedSchema = z.object({
  name: z.string().trim().min(2).max(60),
  category: z.string().trim().min(1).max(40),
  monthlyAmount: z.coerce.number().int().min(1),
});

export async function createFixedExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = fixedSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    monthlyAmount: String(formData.get("monthlyAmount") ?? "").replace(/\D/g, ""),
  });
  if (!parsed.success) return { ok: false, message: "Poné nombre, rubro y monto mensual." };
  const d = parsed.data;
  await prisma.fixedExpense.create({ data: { ...d, startsOn: argentinaDay() } });
  await ensureFixedEntries();
  revalidatePath("/admin/gastos");
  revalidatePath("/admin/ajustes");
  return { ok: true, message: `${d.name} cargado: ${formatPrice(weeklyAmount(d.monthlyAmount))} por semana.` };
}

export async function updateFixedExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = fixedSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    monthlyAmount: String(formData.get("monthlyAmount") ?? "").replace(/\D/g, ""),
  });
  if (!parsed.success) return { ok: false, message: "Poné nombre, rubro y monto mensual." };
  const f = await prisma.fixedExpense.findUnique({ where: { id } });
  if (!f) return { ok: false, message: "Ese gasto fijo ya no existe." };
  await prisma.fixedExpense.update({ where: { id }, data: parsed.data });
  await refreshCurrentWeekEntry(id);
  revalidatePath("/admin/gastos");
  revalidatePath("/admin/ajustes");
  return { ok: true, message: "Gasto fijo guardado." };
}

/** Dar de baja: deja de generar semanas nuevas. Lo ya generado queda (fue un costo real). */
export async function toggleFixedExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const f = await prisma.fixedExpense.findUnique({ where: { id } });
  if (!f) return { ok: false, message: "Ese gasto fijo ya no existe." };
  await prisma.fixedExpense.update({ where: { id }, data: { active: !f.active, startsOn: f.active ? f.startsOn : argentinaDay() } });
  if (!f.active) await ensureFixedEntries();
  revalidatePath("/admin/gastos");
  revalidatePath("/admin/ajustes");
  return { ok: true, message: f.active ? `${f.name} dado de baja. No se generan más semanas.` : `${f.name} reactivado.` };
}

// ---------------------------------------------------------------------------
// Home: fotos del lugar y "Sobre nosotros"
// ---------------------------------------------------------------------------

export async function addPhotoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const file = formData.get("photo");
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 120) || null;
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Elegí una foto." };
  try {
    await addPhoto(file, caption);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "No se pudo subir la foto." };
  }
  revalidatePath("/");
  revalidatePath("/fechas");
  revalidatePath("/admin/ajustes");
  return { ok: true, message: "Foto agregada. Ya se ve en el home." };
}

export async function movePhotoAction(formData: FormData) {
  await requireAdmin();
  const where = String(formData.get("where") ?? "");
  if (where !== "adelante" && where !== "atras" && where !== "portada") return;
  await movePhoto(String(formData.get("id") ?? ""), where);
  revalidatePath("/");
  revalidatePath("/admin/ajustes");
}

export async function removePhotoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  await removePhoto(String(formData.get("id") ?? ""));
  revalidatePath("/");
  revalidatePath("/fechas");
  revalidatePath("/admin/ajustes");
  return { ok: true, message: "Foto borrada." };
}

export async function setAboutAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const text = String(formData.get("about") ?? "").trim().slice(0, 2000);
  await prisma.setting.upsert({ where: { key: "about" }, update: { value: text }, create: { key: "about", value: text } });
  revalidatePath("/");
  revalidatePath("/admin/ajustes");
  return { ok: true, message: text ? "Texto guardado." : "Texto vacío: se muestra el de fábrica." };
}

/** Video de la casa para el home: link de YouTube (o un .mp4). */
export async function setVideoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const url = String(formData.get("video") ?? "").trim();
  if (url && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\/|\.(mp4|webm)(\?|$)/i.test(url)) {
    return { ok: false, message: "Pegá un link de YouTube (o un .mp4 directo)." };
  }
  await prisma.setting.upsert({ where: { key: "video" }, update: { value: url }, create: { key: "video", value: url } });
  revalidatePath("/");
  revalidatePath("/admin/ajustes");
  return { ok: true, message: url ? "Video guardado." : "Video quitado." };
}

export async function setInstagramAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const raw = String(formData.get("instagram") ?? "").trim();
  const handle = raw.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");
  if (handle && !/^[A-Za-z0-9._]{1,30}$/.test(handle)) return { ok: false, message: "Ese usuario no parece válido." };
  await prisma.setting.upsert({ where: { key: "instagram" }, update: { value: handle }, create: { key: "instagram", value: handle } });
  revalidatePath("/");
  revalidatePath("/admin/ajustes");
  return { ok: true, message: handle ? `Instagram guardado: @${handle}` : "Instagram quitado." };
}

// --- Opiniones ---

export async function approveReviewAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const approved = formData.get("approved") === "1";
  const r = await prisma.review.update({ where: { id }, data: { approved } });
  revalidatePath("/");
  revalidatePath(`/admin/eventos/${r.eventId}`);
}

export async function deleteReviewAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const r = await prisma.review.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath(`/admin/eventos/${r.eventId}`);
}

/** Manda "¿cómo la pasaste?" a todos los que pagaron esa cena (una vez por cena). */
export async function requestReviewsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const event = await prisma.event.findUnique({ where: { id }, include: { reservations: { where: { status: "PAID" } } } });
  if (!event) return { ok: false, message: "Cena inexistente." };
  if (event.date.getTime() > Date.now()) return { ok: false, message: "La cena todavía no pasó." };
  if (!isEmailConfigured()) return { ok: false, message: "Los mails no están configurados (ver Ajustes → Estado de los servicios)." };
  const next = await prisma.event.findFirst({ where: { published: true, unlisted: false, date: { gt: new Date() } }, orderBy: { date: "asc" }, select: { id: true, title: true, date: true } });
  const { sent, failed } = await sendReviewRequests({
    event,
    people: event.reservations.map((r) => ({ id: r.id, name: r.name, email: r.email })),
    next,
  });
  await prisma.event.update({ where: { id }, data: { reviewsRequestedAt: new Date() } });
  revalidatePath(`/admin/eventos/${id}`);
  return { ok: true, message: `Pedido enviado a ${sent} persona${sent === 1 ? "" : "s"}${failed ? ` (${failed} fallaron)` : ""}.` };
}

// --- La noche: llegadas ---

export async function toggleArrivedAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const r = await prisma.reservation.findUnique({ where: { id }, select: { arrivedAt: true, eventId: true } });
  if (!r) return;
  await prisma.reservation.update({ where: { id }, data: { arrivedAt: r.arrivedAt ? null : new Date() } });
  revalidatePath(`/admin/eventos/${r.eventId}/noche`);
  revalidatePath(`/admin/eventos/${r.eventId}`);
}

/** Cerrar / reabrir las reservas de una cena (el público ve "reservas cerradas" y pasa a la fecha siguiente). */
/** Publicar o sacar del home una cena, sin pasar por el formulario. */
export async function togglePublishedAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const e = await prisma.event.findUnique({ where: { id }, select: { published: true } });
  if (!e) return;
  await prisma.event.update({ where: { id }, data: { published: !e.published } });
  revalidatePath("/");
  revalidatePath("/fechas");
  revalidatePath("/admin");
  revalidatePath(`/admin/eventos/${id}`);
}

export async function toggleClosedAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const e = await prisma.event.findUnique({ where: { id }, select: { closedAt: true } });
  if (!e) return;
  await prisma.event.update({ where: { id }, data: { closedAt: e.closedAt ? null : new Date() } });
  revalidatePath("/");
  revalidatePath("/fechas");
  revalidatePath(`/admin/eventos/${id}`);
}

// --- Mail de prueba ---

/** Manda la confirmación de ejemplo a la casilla indicada, para ver que los mails salen y cómo llegan. */
export async function sendTestMailAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const to = String(formData.get("to") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return { ok: false, message: "Ese mail no parece válido." };
  if (!isEmailConfigured()) return { ok: false, message: "Los mails no están configurados." };
  const event =
    (await prisma.event.findFirst({ where: { published: true }, orderBy: { date: "asc" } })) ??
    (await prisma.event.findFirst({ orderBy: { date: "desc" } }));
  if (!event) return { ok: false, message: "Cargá una cena primero." };
  const mail = renderReservationConfirmed({ name: "Prueba", event, quantity: 2, seats: [4, 5], amount: event.price * 2, reservationId: "prueba" });
  const organizer = process.env.GMAIL_USER;
  if (organizer) mail.ics = icsFor(event, `${siteUrl()}/reserva/prueba`, `prueba-${Date.now()}`, { organizer, attendee: to });
  const { error } = await sendMail({ to, ...mail, subject: `[PRUEBA] ${mail.subject}` });
  if (error) return { ok: false, message: `No salió: ${error.message}` };
  return { ok: true, message: `Enviado a ${to}. Fijate en la bandeja (y en spam, la primera vez).` };
}

/** Manda el recordatorio a quienes pagaron esta cena y todavía no lo recibieron (por si la tarea diaria no corrió). */
export async function sendRemindersNowAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const event = await prisma.event.findUnique({
    where: { id },
    include: { reservations: { where: { status: "PAID", remindedAt: null }, include: { seats: { orderBy: { number: "asc" } } } } },
  });
  if (!event) return { ok: false, message: "Cena inexistente." };
  if (!isEmailConfigured()) return { ok: false, message: "Los mails no están configurados." };
  if (event.reservations.length === 0) return { ok: true, message: "Ya les llegó a todos." };
  let sent = 0;
  let failed = 0;
  for (const r of event.reservations) {
    const res = await sendReminder({ to: r.email, name: r.name, event, quantity: r.quantity, seats: r.seats.map((s) => s.number), reservationId: r.id });
    if (res.skipped || !res.error) {
      await prisma.reservation.update({ where: { id: r.id }, data: { remindedAt: new Date() } });
      if (!res.skipped) sent++;
    } else failed++;
  }
  revalidatePath(`/admin/eventos/${id}`);
  return { ok: failed === 0, message: `Recordatorio enviado a ${sent} persona${sent === 1 ? "" : "s"}${failed ? ` (${failed} fallaron)` : ""}.` };
}

// --- Cómo se cobra ---

export async function setPaymentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const mode = String(formData.get("mode")) === "transferencia" ? "transferencia" : "mercadopago";
  const alias = String(formData.get("alias") ?? "").trim().slice(0, 80);
  const holder = String(formData.get("holder") ?? "").trim().slice(0, 80);
  const bank = String(formData.get("bank") ?? "").trim().slice(0, 80);
  const holdHours = Math.min(168, Math.max(1, Math.round(Number(formData.get("holdHours")) || 24)));
  if (mode === "transferencia" && !alias) return { ok: false, message: "Para cobrar por transferencia hay que cargar el alias o CBU." };
  await setPaymentConfig({ mode, alias, holder, bank, holdHours });
  revalidatePath("/");
  revalidatePath("/fechas");
  revalidatePath("/condiciones");
  revalidatePath("/admin");
  revalidatePath("/admin/ajustes");
  return { ok: true, message: mode === "transferencia" ? `Listo: se cobra por transferencia (alias ${alias}).` : "Listo: se cobra por Mercado Pago." };
}

// ---------------------------------------------------------------------------
// "Puertas adentro": el juego de las mesitas
// ---------------------------------------------------------------------------

/**
 * Guarda el cóctel de recepción y, por cada acto, el ingrediente escondido, los tres señuelos
 * y por qué va ese trago. Los campos vacíos se borran (el acto queda sin secreto).
 */
export async function saveStepsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const event = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!event) return { ok: false, message: "Esa cena no existe." };

  const welcomeDrink = String(formData.get("welcomeDrink") ?? "").trim().slice(0, 160) || null;
  const count = Math.min(Number(formData.get("count") ?? 0) || 0, 20);
  const rows: { index: number; secret: string | null; decoys: string | null; why: string | null }[] = [];
  for (let i = 0; i <= count; i++) {
    const secret = String(formData.get(`secret_${i}`) ?? "").trim().slice(0, 60) || null;
    const decoys = String(formData.get(`decoys_${i}`) ?? "")
      .split(/[,\n]/)
      .map((d) => d.trim())
      .filter(Boolean);
    const why = String(formData.get(`why_${i}`) ?? "").trim().slice(0, 400) || null;
    if (decoys.length > 3) return { ok: false, message: `En el acto ${i + 1} hay más de tres señuelos.` };
    if (new Set(decoys.map((d) => d.toLowerCase())).size !== decoys.length) return { ok: false, message: `En el acto ${i + 1} hay un señuelo repetido.` };
    if (secret && decoys.some((d) => d.toLowerCase() === secret.toLowerCase())) {
      return { ok: false, message: `En el acto ${i + 1} un señuelo repite el ingrediente escondido.` };
    }
    rows.push({ index: i, secret, decoys: decoys.length ? decoys.join(", ") : null, why });
  }

  await prisma.$transaction([
    prisma.event.update({ where: { id }, data: { welcomeDrink } }),
    prisma.eventStep.deleteMany({ where: { eventId: id, index: { gt: count } } }),
    ...rows.map((r) =>
      prisma.eventStep.upsert({
        where: { eventId_index: { eventId: id, index: r.index } },
        update: { secret: r.secret, decoys: r.decoys, why: r.why },
        create: { eventId: id, ...r },
      }),
    ),
  ]);
  revalidatePath(`/admin/eventos/${id}`);
  const complete = rows.every((r) => r.secret && r.decoys && r.decoys.split(",").length === 3);
  return { ok: true, message: complete ? "Guardado. El juego está listo para esa noche." : "Guardado. Faltan secretos o señuelos en algún acto: esa noche ese acto se lee pero no se juega." };
}

/** Prende o apaga el juego de las mesitas en todo el sitio (el QR muestra solo la carta). */
export async function toggleHoyAction(formData: FormData) {
  await requireAdmin();
  const off = formData.get("off") === "1";
  await prisma.setting.upsert({ where: { key: "hoy:off" }, update: { value: off ? "1" : "0" }, create: { key: "hoy:off", value: off ? "1" : "0" } });
  revalidatePath("/admin/ajustes");
}

// ---------------------------------------------------------------------------
// Premios y récords de los juegos
// ---------------------------------------------------------------------------

/** Marca un trago ganado como canjeado (quién lo canjeó = la sesión del panel). */
export async function redeemPrizeAction(formData: FormData) {
  await requireAdmin();
  const me = await whoAmI();
  const id = String(formData.get("id") ?? "");
  await prisma.prize.updateMany({ where: { id, redeemedAt: null }, data: { redeemedAt: new Date(), redeemedBy: me.role === "user" ? me.name : "maestra" } });
  revalidatePath("/admin/premios");
}

/** Saca el nombre de un récord (la marca queda, anónima). */
export async function deleteRecordAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.gameScore.updateMany({ where: { id }, data: { name: null } });
  revalidatePath("/admin/premios");
}

// ---------------------------------------------------------------------------
// La barra de la noche
// ---------------------------------------------------------------------------

const barSaleSchema = z.object({
  eventId: z.string().min(1),
  table: z.number().int().min(0).max(30),
  item: z.string().trim().min(1).max(80),
  price: z.number().int().min(0),
  delta: z.union([z.literal(1), z.literal(-1)]),
});

export type BarSaleResult = { ok: true; rows: { table: number; item: string; price: number; qty: number }[] } | { ok: false; error: string };

/** +1 / −1 de un trago en una mesita. */
export async function barSaleAction(input: unknown): Promise<BarSaleResult> {
  await requireAdmin();
  const parsed = barSaleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dato inválido." };
  const { eventId, table, item, price, delta } = parsed.data;
  const current = await prisma.barSale.findUnique({ where: { eventId_table_item: { eventId, table, item } } });
  if (current?.settledAt) return { ok: false, error: "La barra de esta cena ya se cerró." };
  if (!current) {
    if (delta > 0) {
      const exists = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
      if (!exists) return { ok: false, error: "Esa cena no existe." };
      await prisma.barSale.create({ data: { eventId, table, item, price, qty: delta } });
    }
  } else if (delta > 0) {
    // Suma en la base (no leer-y-escribir): dos toques rápidos o dos celulares no se pisan.
    await prisma.barSale.update({ where: { id: current.id }, data: { qty: { increment: delta }, price } });
  } else if (delta < 0) {
    await prisma.barSale.updateMany({ where: { id: current.id, qty: { gte: -delta } }, data: { qty: { decrement: -delta }, price } });
  }
  const rows = await prisma.barSale.findMany({ where: { eventId }, select: { table: true, item: true, price: true, qty: true } });
  return { ok: true, rows };
}

/** Cierra la barra: suma todo y lo carga en la caja de la cena como ingreso "Barra". */
export async function closeBarAction(input: unknown): Promise<{ ok: true; message?: string } | { ok: false; error: string }> {
  await requireAdmin();
  const me = await whoAmI();
  const parsed = z.object({ eventId: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dato inválido." };
  const { eventId } = parsed.data;
  const open = await prisma.barSale.findMany({ where: { eventId, settledAt: null, qty: { gt: 0 } } });
  const total = open.reduce((n, s) => n + s.qty * s.price, 0);
  if (total === 0) return { ok: false, error: "No hay nada que cerrar." };
  const byItem = new Map<string, number>();
  for (const s of open) byItem.set(s.item, (byItem.get(s.item) ?? 0) + s.qty);
  const description = `Barra de la noche: ${[...byItem].map(([item, q]) => `${q} ${item}`).join(", ")}`;
  await prisma.$transaction([
    prisma.ledgerEntry.create({
      data: { eventId, kind: "INCOME", category: "barra", description: description.slice(0, 200), amount: total, day: argentinaDay(), by: me.name, fromPocket: false, createdBy: me.name },
    }),
    prisma.barSale.updateMany({ where: { eventId, settledAt: null }, data: { settledAt: new Date() } }),
  ]);
  revalidatePath(`/admin/eventos/${eventId}`);
  revalidatePath("/admin/gastos");
  return { ok: true, message: `Cargado en la caja: ${formatPrice(total)}.` };
}

// ---------- la noche en vivo: carta, pedidos, huellas, recomendaciones ----------

/** La cocina marca qué acto acaba de salir a la mesa (o vuelve a "todavía nada"). */
export async function serveStepAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("step") ?? "");
  const step = raw === "" ? null : Number(raw);
  if (step != null && (!Number.isInteger(step) || step < 0 || step > 20)) return;
  await setServedStep(id, step);
  revalidatePath(`/admin/eventos/${id}/vivo`);
}

export async function pedidoStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "pendiente" && status !== "listo" && status !== "cancelado") return;
  await setPedidoStatus(id, status);
  revalidatePath(`/admin/eventos/${eventId}/vivo`);
}

/** Aprobar saca la huella al home; ocultar la deja guardada sin mostrar; borrar la elimina con su foto. */
export async function huellaModerateAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const what = String(formData.get("what") ?? "");
  if (what === "aprobar") await approveHuella(id, true);
  else if (what === "ocultar") await approveHuella(id, false);
  else if (what === "borrar") await removeHuella(id);
  else return;
  revalidatePath("/");
  revalidatePath(`/admin/eventos/${eventId}/vivo`);
  revalidatePath("/admin/huellas");
}

export async function sugerenciaAdminAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const what = String(formData.get("what") ?? "");
  if (what === "vista") await markSugerenciasSeen([id]);
  else if (what === "borrar") await removeSugerencia(id);
  else return;
  revalidatePath("/admin/huellas");
  const eventId = String(formData.get("eventId") ?? "");
  if (eventId) revalidatePath(`/admin/eventos/${eventId}/vivo`);
}

// ---------- la sala: cuentas por persona, cobro y pedidos ----------

/** Cobra (o perdona) la cena de una cuenta: con eso se destraba y la persona puede pedir. */
export async function cobrarCenaAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const via = String(formData.get("via") ?? "");
  const montoRaw = String(formData.get("monto") ?? "").replace(/\D/g, "");
  if (!COVER_VIAS.includes(via as CoverVia)) return;
  await saldarCover(id, via as CoverVia, montoRaw ? Number(montoRaw) : undefined);
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
  const monto = Number(String(formData.get("monto") ?? "").replace(/\D/g, "")) || 0;
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
  await cargarExtra(id, item, price, qty);
  revalidatePath(`/admin/eventos/${eventId}/sala`);
}

/** Cierra la cuenta: ya cobró todo lo que consumió. */
export async function cerrarCuentaAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const via = String(formData.get("via") ?? "efectivo");
  if (via !== "efectivo" && via !== "transferencia" && via !== "invitado") return;
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
  // Si ya se cargó la sala de esta noche, no se duplica el ingreso.
  const yaEsta = await prisma.ledgerEntry.findFirst({ where: { eventId, category: "cena", deletedAt: null, description: { startsWith: "Sala:" } } });
  if (yaEsta) {
    const resto = total - yaEsta.amount;
    if (resto <= 0) return;
    await prisma.ledgerEntry.update({ where: { id: yaEsta.id }, data: { amount: total, description: `Sala: ${r.personas} personas (${r.invitados} de la casa), cenas ${formatPrice(r.cobradoCena)}, barra ${formatPrice(r.cobradoConsumo)}`.slice(0, 200), updatedAt: new Date(), updatedBy: me.name } });
    revalidatePath(`/admin/eventos/${eventId}/sala`);
    revalidatePath("/admin/gastos");
    return;
  }
  const detalle = `Sala: ${r.personas} personas (${r.invitados} de la casa), cenas ${formatPrice(r.cobradoCena)}, barra ${formatPrice(r.cobradoConsumo)}`;
  await prisma.ledgerEntry.create({
    data: { eventId, kind: "INCOME", category: "cena", description: detalle.slice(0, 200), amount: total, day: argentinaDay(), by: me.name, fromPocket: false, createdBy: me.name },
  });
  revalidatePath(`/admin/eventos/${eventId}/sala`);
  revalidatePath("/admin/gastos");
}
