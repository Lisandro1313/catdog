"use server";

import { z } from "zod";
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
});

export type ReserveResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

export async function reserveAction(input: unknown): Promise<ReserveResult> {
  const parsed = reserveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
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
  await prisma.subscriber.upsert({
    where: { email: email.data },
    update: {},
    create: { email: email.data },
  });
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
