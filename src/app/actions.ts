"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { joinWaitlist, notifyWaitlist } from "@/lib/waitlist";
import { cancelReservation } from "@/lib/reservations";
import { sendAdminDeclined } from "@/lib/email";
import { allowRequest } from "@/lib/rate-limit";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ReservationError, chooseSeats, createHoldAndCheckout, transferReservation } from "@/lib/reservations";
import { MAX_SEATS_PER_RESERVATION, normalizeArPhone } from "@/lib/config";
import { canReview } from "@/lib/reviews";
import { sendAdminNewReview } from "@/lib/email";

const reserveSchema = z.object({
  eventId: z.string().min(1),
  quantity: z.number().int().min(1).max(MAX_SEATS_PER_RESERVATION),
  name: z.string().trim().min(2, "Poné tu nombre").max(80),
  email: z.email("Email inválido").max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
  gift: z.boolean().optional(),
  giftName: z.string().trim().max(60).optional().or(z.literal("")),
  giftEmail: z.email().max(120).optional().or(z.literal("")),
  giftMessage: z.string().trim().max(300).optional().or(z.literal("")),
});

export type ReserveResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

export async function reserveAction(input: unknown): Promise<ReserveResult> {
  const parsed = reserveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  if (parsed.data.gift && !(parsed.data.giftName ?? "").trim()) return { ok: false, error: "Contanos para quién es el regalo." };
  try {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const ipHash = ip ? createHash("sha256").update(ip).digest("hex").slice(0, 32) : undefined;
    const { checkoutUrl } = await createHoldAndCheckout({
      ipHash,
      eventId: parsed.data.eventId,
      quantity: parsed.data.quantity,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone ? normalizeArPhone(parsed.data.phone) || undefined : undefined,
      notes: parsed.data.notes || undefined,
      gift: parsed.data.gift
        ? { name: parsed.data.giftName || "", email: parsed.data.giftEmail ? parsed.data.giftEmail.toLowerCase() : null, message: parsed.data.giftMessage || null }
        : undefined,
    });
    return { ok: true, checkoutUrl };
  } catch (err) {
    if (err instanceof ReservationError) return { ok: false, error: err.message };
    console.error("[reserve] error inesperado", err);
    return { ok: false, error: "Algo salió mal. Probá de nuevo." };
  }
}

const chooseSchema = z.object({
  reservationId: z.string().min(1),
  seats: z.array(z.number().int().min(1).max(200)).min(1).max(MAX_SEATS_PER_RESERVATION),
});

export type ChooseSeatsResult = { ok: true; seats: number[] } | { ok: false; error: string };

export async function chooseSeatsAction(input: unknown): Promise<ChooseSeatsResult> {
  const parsed = chooseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Elegí tus lugares." };
  try {
    const seats = await chooseSeats(parsed.data.reservationId, parsed.data.seats);
    return { ok: true, seats };
  } catch (err) {
    if (err instanceof ReservationError) return { ok: false, error: err.message };
    console.error("[chooseSeats] error inesperado", err);
    return { ok: false, error: "Algo salió mal. Probá de nuevo." };
  }
}

export type SubscribeResult = { ok: true } | { ok: false; error: string };

export async function subscribeAction(_prev: SubscribeResult | null, formData: FormData): Promise<SubscribeResult> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { ok: false, error: "Ese email no parece válido." };
  if (!(await allowRequest("subscribe", 5))) return { ok: false, error: "Demasiados intentos. Probá en un rato." };
  try {
    await prisma.subscriber.upsert({
      where: { email: email.data },
      update: {},
      create: { email: email.data },
    });
  } catch (err) {
    console.error("[subscribe]", err);
    return { ok: false, error: "No pudimos anotarte ahora. Probá de nuevo en un momento." };
  }
  return { ok: true };
}

const waitlistSchema = z.object({
  eventId: z.string().min(1),
  email: z.email(),
  name: z.string().trim().max(60).optional(),
  quantity: z.coerce.number().int().min(1).max(4),
});

/** Lista de espera de una fecha agotada: avisamos por mail cuando se libera un lugar. */
export async function waitlistAction(_prev: SubscribeResult | null, formData: FormData): Promise<SubscribeResult> {
  const parsed = waitlistSchema.safeParse({
    eventId: formData.get("eventId"),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    name: formData.get("name") || undefined,
    quantity: formData.get("quantity") ?? 1,
  });
  if (!parsed.success) return { ok: false, error: "Revisá el email." };
  if (!(await allowRequest("waitlist", 5))) return { ok: false, error: "Demasiados intentos. Probá en un rato." };
  const event = await prisma.event.findUnique({ where: { id: parsed.data.eventId }, select: { published: true, date: true } });
  if (!event || !event.published || event.date.getTime() < Date.now()) return { ok: false, error: "Esa fecha ya no está disponible." };
  try {
    await joinWaitlist(parsed.data.eventId, parsed.data.email, parsed.data.name ?? null, parsed.data.quantity);
  } catch (err) {
    console.error("[waitlist]", err);
    return { ok: false, error: "No pudimos anotarte ahora. Probá de nuevo en un momento." };
  }
  return { ok: true };
}

const reviewSchema = z.object({
  reservationId: z.string().min(1),
  name: z.string().trim().min(2, "Poné cómo querés que aparezca tu nombre").max(60),
  rating: z.number().int().min(1, "Elegí las estrellas").max(5),
  text: z.string().trim().min(10, "Contanos un poquito más").max(400, "Hasta 400 caracteres"),
});

export type ReviewResult = { ok: true } | { ok: false; error: string };

/** Opinión de alguien que vino: queda pendiente hasta que se aprueba en el panel. */
export async function submitReviewAction(input: unknown): Promise<ReviewResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  if (!(await allowRequest("opinion", 10))) return { ok: false, error: "Demasiados intentos; probá en un rato." };
  const { reservationId, name, rating, text } = parsed.data;
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId }, include: { event: true } });
  if (!reservation || !canReview(reservation)) return { ok: false, error: "Esta reserva todavía no puede opinar." };
  await prisma.review.upsert({
    where: { reservationId },
    update: { name, rating, text, approved: false },
    create: { reservationId, eventId: reservation.eventId, name, rating, text },
  });
  sendAdminNewReview({ name, rating, text, event: reservation.event, eventId: reservation.eventId }).catch(() => {});
  return { ok: true };
}

const transferSchema = z.object({
  reservationId: z.string().min(1),
  name: z.string().trim().min(2, "Poné el nombre de la persona").max(80),
  email: z.email("Email inválido").max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

export type TransferResult = { ok: true; name: string; email: string } | { ok: false; error: string };

/** Pasarle la reserva a otra persona (nombre, mail y WhatsApp nuevos; las sillas quedan). */
export async function transferReservationAction(input: unknown): Promise<TransferResult> {
  const parsed = transferSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  try {
    const r = await transferReservation(parsed.data.reservationId, {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone ? normalizeArPhone(parsed.data.phone) || undefined : undefined,
    });
    return { ok: true, name: r.name, email: r.email };
  } catch (err) {
    if (err instanceof ReservationError) return { ok: false, error: err.message };
    console.error("[transfer] error inesperado", err);
    return { ok: false, error: "Algo salió mal. Probá de nuevo." };
  }
}

/** Desde el recordatorio: "no voy a poder". Cancela la reserva paga, libera el lugar y avisa (admin + lista de espera). */
/** "Confirmo que voy" desde el recordatorio: un botón (POST), no un link, para que el prefetch del cliente de mail no confirme solo. */
export async function confirmReservationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const r = await prisma.reservation.findUnique({ where: { id }, select: { status: true, confirmedAt: true } });
  if (r && r.status === "PAID" && !r.confirmedAt) {
    await prisma.reservation.update({ where: { id }, data: { confirmedAt: new Date() } });
  }
  redirect(`/reserva/${id}?confirmado=1`);
}

export async function declineReservationAction(_prev: SubscribeResult | null, formData: FormData): Promise<SubscribeResult> {
  const id = String(formData.get("id") ?? "");
  const r = await prisma.reservation.findUnique({ where: { id }, include: { event: true } });
  if (!r) return { ok: false, error: "Reserva inexistente." };
  if (r.status !== "PAID") return { ok: false, error: "Esa reserva no está confirmada." };
  if (r.event.date.getTime() < Date.now()) return { ok: false, error: "Esa cena ya pasó." };
  if (r.arrivedAt) return { ok: false, error: "Esa reserva ya fue usada." };
  await cancelReservation(id);
  await prisma.reservation.update({ where: { id }, data: { declinedAt: new Date() } });
  sendAdminDeclined({ name: r.name, email: r.email, phone: r.phone, event: r.event, eventId: r.eventId, quantity: r.quantity, amount: r.amount }).catch(() => {});
  notifyWaitlist(r.eventId).catch((err) => console.error("[waitlist] aviso falló", err));
  revalidatePath("/");
  redirect(`/reserva/${id}?liberado=1`);
}
