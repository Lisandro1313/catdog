"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkPassword, clearAdminSession, isAdmin, setAdminSession } from "@/lib/admin-auth";
import { parseArgentinaLocal } from "@/lib/dates";
import { sendNewEventBlast } from "@/lib/email";
import { ReservationError, cancelReservation, chooseSeats, createManualReservation, markPaid } from "@/lib/reservations";

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
  redirect("/admin");
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
