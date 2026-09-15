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
import { formatPrice } from "@/lib/config";
import { addPhoto, removePhoto } from "@/lib/photos";
import { sendNewEventBlast, sendReviewRequests } from "@/lib/email";
import { isEmailConfigured } from "@/lib/mailer";
import { ReservationError, cancelReservation, chooseSeats, createManualReservation, markPaid } from "@/lib/reservations";
import { runAnalysis } from "@/lib/ai-analysis";

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
  if (user) {
    if (!(await verifyUser(user, password))) return { ok: false, message: "Contraseña incorrecta." };
    await setSession({ name: user, role: "user" });
  } else {
    if (!checkMaster(password)) return { ok: false, message: "Contraseña incorrecta." };
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
  title: z.string().trim().min(2).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Fecha inválida"),
  price: z.coerce.number().int().min(0),
  capacity: z.coerce.number().int().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  menu: z.string().trim().max(4000).optional(),
  bar: z.string().trim().max(4000).optional(),
  barPrice: z.coerce.number().int().min(0).optional(),
  address: z.string().trim().max(200).optional(),
  published: z.boolean(),
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
    published: formData.get("published") === "on",
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
      published: d.published,
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

  const taken = await prisma.seat.aggregate({ where: { eventId: id }, _max: { number: true } });
  if (taken._max.number && taken._max.number > d.capacity) {
    return { ok: false, message: `Hay un lugar ${taken._max.number} reservado; no podés bajar la capacidad a ${d.capacity}.` };
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
      published: d.published,
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
  const source = await prisma.event.findUnique({ where: { id } });
  if (!source) redirect("/admin");
  const date = new Date(source.date.getTime() + 7 * 24 * 60 * 60 * 1000);
  const n = source.title.match(/^Cena\s+([IVXLC]+)\s*·\s*(.+)$/i);
  const title = n ? `Cena ${nextRoman(n[1])} · ${n[2]}` : source.title;
  const copy = await prisma.event.create({
    data: {
      title,
      date,
      price: source.price,
      capacity: source.capacity,
      description: source.description,
      menu: source.menu,
      bar: source.bar,
      barPrice: source.barPrice,
      address: source.address,
      published: false,
    },
  });
  redirect(`/admin/eventos/${copy.id}?copiada=1`);
}

function nextRoman(roman: string): string {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  const up = roman.toUpperCase();
  let value = 0;
  for (let i = 0; i < up.length; i++) {
    const cur = map[up[i]] ?? 0;
    const next = map[up[i + 1]] ?? 0;
    value += cur < next ? -cur : cur;
  }
  value += 1;
  const table: [number, string][] = [[100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [num, sym] of table) while (value >= num) { out += sym; value -= num; }
  return out;
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

export async function markPaidAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const via = String(formData.get("via") ?? "efectivo");
  const r = await prisma.reservation.findUnique({ where: { id }, select: { eventId: true, status: true } });
  if (!r || r.status === "PAID") return;
  await markPaid(id, via);
  revalidatePath("/");
  revalidatePath(`/admin/eventos/${r.eventId}`);
}

export async function cancelReservationAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const r = await prisma.reservation.findUnique({ where: { id }, select: { eventId: true } });
  if (!r) return;
  await cancelReservation(id);
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
  const { sent, failed } = await sendReviewRequests({
    event,
    people: event.reservations.map((r) => ({ id: r.id, name: r.name, email: r.email })),
  });
  await prisma.event.update({ where: { id }, data: { reviewsRequestedAt: new Date() } });
  revalidatePath(`/admin/eventos/${id}`);
  return { ok: true, message: `Pedido enviado a ${sent} persona${sent === 1 ? "" : "s"}${failed ? ` (${failed} fallaron)` : ""}.` };
}
