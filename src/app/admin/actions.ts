"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkPassword, clearAdminSession, isAdmin, setAdminSession } from "@/lib/admin-auth";
import { argentinaDay, parseArgentinaLocal } from "@/lib/dates";
import { sendNewEventBlast } from "@/lib/email";
import { ReservationError, cancelReservation, chooseSeats, createManualReservation, markPaid } from "@/lib/reservations";
import { runAnalysis } from "@/lib/ai-analysis";

export type ActionState = { ok: boolean; message?: string } | null;

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    return { ok: false, message: "Contraseña incorrecta." };
  }
  await setAdminSession();
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
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

export async function notifySubscribersAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return { ok: false, message: "Evento inexistente." };
  const subs = await prisma.subscriber.findMany({ select: { email: true } });
  if (subs.length === 0) return { ok: false, message: "No hay suscriptores todavía." };
  if (!process.env.RESEND_API_KEY) return { ok: false, message: "Falta RESEND_API_KEY: los mails no están habilitados." };

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
  const needsCategory = d.kind === "INCOME" || d.kind === "EXPENSE";
  if (needsCategory && !d.category) return { ok: false, message: "Elegí un rubro." };
  if (!needsCategory && !d.by) return { ok: false, message: "Elegí el socio." };
  // El día llega como "2026-09-11" (fecha argentina) y se guarda como fecha sin hora.
  const day = d.day ? new Date(`${d.day}T00:00:00Z`) : argentinaDay();
  await prisma.ledgerEntry.create({
    data: {
      eventId: d.eventId ?? null,
      kind: d.kind,
      category: needsCategory ? (d.category as string) : "socio",
      description: d.description ?? null,
      amount: d.amount,
      day,
      by: d.by ?? null,
      // Un gasto pagado "de la caja" no genera deuda con el socio.
      fromPocket: d.kind === "EXPENSE" ? d.fromPocket !== "no" : true,
    },
  });
  if (d.eventId) revalidatePath(`/admin/eventos/${d.eventId}`);
  revalidatePath("/admin/gastos");
  revalidatePath("/admin");
  const label = { INCOME: "Ingreso", EXPENSE: "Gasto", CONTRIBUTION: "Aporte", WITHDRAWAL: "Retiro" }[d.kind];
  return { ok: true, message: `${label} cargado.`, savedAt: Date.now() };
}

export async function deleteLedgerEntryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const e = await prisma.ledgerEntry.findUnique({ where: { id }, select: { eventId: true } });
  if (!e) return;
  await prisma.ledgerEntry.delete({ where: { id } });
  if (e.eventId) revalidatePath(`/admin/eventos/${e.eventId}`);
  revalidatePath("/admin/gastos");
  revalidatePath("/admin");
}

/** Reserva que se guarda en la caja para gastos fijos antes de repartir. */
export async function setReserveAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const n = parseInt(String(formData.get("reserve") ?? "").replace(/\D/g, ""), 10);
  if (!Number.isFinite(n) || n < 0) return { ok: false, message: "Poné un número." };
  await prisma.setting.upsert({ where: { key: "reserve" }, update: { value: String(n) }, create: { key: "reserve", value: String(n) } });
  revalidatePath("/admin/gastos");
  return { ok: true, message: "Reserva guardada." };
}

/** Pide a la IA un análisis con los números actuales y lo guarda. */
export async function runAnalysisAction(): Promise<ActionState> {
  await requireAdmin();
  try {
    await runAnalysis();
  } catch (err) {
    console.error("[ia] análisis falló", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (/credit card|customer_verification/i.test(msg)) {
      return {
        ok: false,
        message: "Falta habilitar la IA en Vercel: hay que cargar una tarjeta en AI Gateway para desbloquear los créditos gratis (ver README).",
      };
    }
    if (/401|unauthenticated|credential|api key|oidc/i.test(msg)) {
      return { ok: false, message: "La IA no está autenticada en Vercel: falta activar AI Gateway (ver README)." };
    }
    return { ok: false, message: "No pude generar el análisis. Probá de nuevo en un rato." };
  }
  revalidatePath("/admin/gastos");
  return { ok: true, message: "Análisis actualizado." };
}
