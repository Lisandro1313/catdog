"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ReservationError, chooseSeats, createHoldAndCheckout } from "@/lib/reservations";
import { MAX_SEATS_PER_RESERVATION } from "@/lib/config";

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
    const { checkoutUrl } = await createHoldAndCheckout({
      eventId: parsed.data.eventId,
      quantity: parsed.data.quantity,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone || undefined,
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
