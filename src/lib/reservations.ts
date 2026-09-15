import { prisma } from "./prisma";
import { HOLD_MINUTES, MAX_SEATS_PER_RESERVATION, siteUrl } from "./config";
import { createPreference, getPayment, isMercadoPagoConfigured } from "./mp";
import { sendAdminNewReservation, sendReservationConfirmed } from "./email";
import type { Prisma } from "@/generated/prisma/client";

export class ReservationError extends Error {}

const FAR_FUTURE = new Date("2100-01-01T00:00:00Z");

/** Borra las reservas pendientes vencidas de un evento (libera sus cupos). */
export async function purgeExpiredHolds(eventId: string) {
  await prisma.reservation.deleteMany({
    where: { eventId, status: "PENDING", expiresAt: { lt: new Date() } },
  });
}

/** El próximo evento publicado (el que se muestra en el home). Tolera hasta 6 h después del inicio. */
export async function getNextEvent() {
  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000);
  return prisma.event.findFirst({
    where: { published: true, date: { gte: cutoff } },
    orderBy: { date: "asc" },
  });
}

type Db = Prisma.TransactionClient | typeof prisma;

export type UpcomingEvent = Awaited<ReturnType<typeof getNextEvent>> & { free: number };

/**
 * Las próximas cenas publicadas (la más cercana primero), cada una con sus lugares libres.
 * El home las usa para pasar la reserva a la fecha siguiente cuando la primera se llena.
 */
export async function getUpcomingEvents(limit = 4): Promise<NonNullable<UpcomingEvent>[]> {
  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const events = await prisma.event.findMany({
    where: { published: true, date: { gte: cutoff } },
    orderBy: { date: "asc" },
    take: limit,
  });
  const free = await Promise.all(events.map((e) => getFreeCount(e.id, e.capacity)));
  return events.map((e, i) => ({ ...e, free: free[i] }));
}

/** Cupos ocupados: pagados + en proceso de pago (hold vigente). */
export async function getOccupancy(eventId: string, db: Db = prisma) {
  const now = new Date();
  const [paid, holding] = await Promise.all([
    db.reservation.aggregate({ where: { eventId, status: "PAID" }, _sum: { quantity: true } }),
    db.reservation.aggregate({
      where: { eventId, status: "PENDING", expiresAt: { gt: now } },
      _sum: { quantity: true },
    }),
  ]);
  return { paid: paid._sum.quantity ?? 0, holding: holding._sum.quantity ?? 0 };
}

export async function getFreeCount(eventId: string, capacity: number) {
  const { paid, holding } = await getOccupancy(eventId);
  return Math.max(0, capacity - paid - holding);
}

/** Sillas ya elegidas por gente que pagó. */
export async function getTakenSeats(eventId: string): Promise<number[]> {
  const seats = await prisma.seat.findMany({
    where: { eventId, reservation: { status: "PAID" } },
    select: { number: true },
  });
  return seats.map((s) => s.number);
}

export type CreateHoldInput = {
  eventId: string;
  quantity: number;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  /** Hash de la IP (no la IP): para que nadie bloquee la mesa con muchas reservas sin pagar. */
  ipHash?: string;
};

/** Cuántas reservas en proceso (sin pagar) puede tener a la vez una misma IP en una cena. */
const MAX_HOLDS_PER_IP = 2;

/**
 * Crea la reserva PENDING (bloquea `quantity` cupos por HOLD_MINUTES) y genera el link de pago.
 * Las sillas concretas se eligen después de pagar.
 */
export async function createHoldAndCheckout(input: CreateHoldInput) {
  const event = await prisma.event.findUnique({ where: { id: input.eventId } });
  if (!event || !event.published) throw new ReservationError("El evento ya no está disponible.");
  if (event.date.getTime() < Date.now()) throw new ReservationError("Ese evento ya pasó.");
  if (input.quantity < 1 || input.quantity > MAX_SEATS_PER_RESERVATION) {
    throw new ReservationError(`Podés reservar entre 1 y ${MAX_SEATS_PER_RESERVATION} lugares.`);
  }
  if (!isMercadoPagoConfigured()) {
    throw new ReservationError("Los pagos todavía no están habilitados. Probá en un rato.");
  }

  await purgeExpiredHolds(event.id);

  // Si esta misma persona ya tiene una reserva en proceso para esta cena, la reusamos:
  // vuelve al mismo pago en vez de bloquear más lugares.
  const existing = await prisma.reservation.findFirst({
    where: { eventId: event.id, email: input.email, status: "PENDING", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (existing?.mpInitPoint) return { reservationId: existing.id, checkoutUrl: existing.mpInitPoint };

  if (input.ipHash) {
    const holds = await prisma.reservation.count({
      where: { eventId: event.id, ipHash: input.ipHash, status: "PENDING", expiresAt: { gt: new Date() } },
    });
    if (holds >= MAX_HOLDS_PER_IP) {
      throw new ReservationError("Ya tenés reservas en proceso. Terminá el pago de la anterior o esperá unos minutos.");
    }
  }

  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
  const amount = event.price * input.quantity;

  // Lock por evento para que dos personas no tomen los últimos cupos a la vez.
  const reservation = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${event.id}))`;
    const { paid, holding } = await getOccupancy(event.id, tx);
    const free = event.capacity - paid - holding;
    if (free < input.quantity) {
      throw new ReservationError(
        free <= 0 ? "Se acaban de agotar los lugares." : `Quedan solo ${free} lugar${free === 1 ? "" : "es"}.`,
      );
    }
    return tx.reservation.create({
      data: {
        eventId: event.id,
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        notes: input.notes || null,
        ipHash: input.ipHash ?? null,
        quantity: input.quantity,
        amount,
        expiresAt,
      },
    });
  });

  try {
    const pref = await createPreference({
      reservationId: reservation.id,
      title: `${event.title} · ${input.quantity} lugar${input.quantity > 1 ? "es" : ""}`,
      quantity: input.quantity,
      unitPrice: event.price,
      payerName: input.name,
      payerEmail: input.email,
      expiresAt,
      siteUrl: siteUrl(),
    });
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { mpPreferenceId: pref.id, mpInitPoint: pref.initPoint },
    });
    return { reservationId: reservation.id, checkoutUrl: pref.initPoint };
  } catch (err) {
    // Si Mercado Pago falla, liberamos el cupo.
    await prisma.reservation.delete({ where: { id: reservation.id } }).catch(() => {});
    console.error("[mp] createPreference falló", err);
    throw new ReservationError("No pudimos iniciar el pago. Intentá de nuevo en un momento.");
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

/**
 * Quien ya pagó elige (o cambia) sus sillas. Tiene que elegir exactamente `quantity`.
 */
export async function chooseSeats(reservationId: string, numbers: number[]) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { event: true },
  });
  if (!reservation) throw new ReservationError("Reserva inexistente.");
  if (reservation.status !== "PAID") throw new ReservationError("Primero hay que completar el pago.");
  if (reservation.event.date.getTime() < Date.now()) throw new ReservationError("Ese evento ya pasó.");

  const unique = Array.from(new Set(numbers)).sort((a, b) => a - b);
  if (unique.length !== reservation.quantity) {
    throw new ReservationError(
      reservation.quantity === 1 ? "Elegí un lugar." : `Tenés que elegir ${reservation.quantity} lugares.`,
    );
  }
  if (unique.some((n) => n < 1 || n > reservation.event.capacity)) {
    throw new ReservationError("Lugar inválido.");
  }

  try {
    await prisma.$transaction([
      prisma.seat.deleteMany({ where: { reservationId } }),
      prisma.seat.createMany({
        data: unique.map((number) => ({ number, eventId: reservation.eventId, reservationId })),
      }),
      prisma.reservation.update({ where: { id: reservationId }, data: { seatsChosenAt: new Date() } }),
    ]);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ReservationError("Alguien acaba de elegir uno de esos lugares. Probá con otro.");
    }
    throw err;
  }
  return unique;
}

/**
 * Consulta un pago en Mercado Pago y, si está aprobado, confirma la reserva.
 * Idempotente: se puede llamar desde el webhook y desde la página de retorno.
 */
export async function confirmPaymentById(paymentId: string) {
  const payment = await getPayment(paymentId);
  if (!payment.externalReference) return { ok: false as const, reason: "sin external_reference" };

  const reservation = await prisma.reservation.findUnique({
    where: { id: payment.externalReference },
    include: { event: true },
  });
  if (!reservation) return { ok: false as const, reason: "reserva inexistente" };
  if (reservation.status === "PAID") return { ok: true as const, alreadyPaid: true };

  if (payment.status !== "approved") {
    return { ok: false as const, reason: `pago ${payment.status}` };
  }
  if (payment.amount !== null && Math.round(payment.amount) < reservation.amount) {
    console.error("[mp] monto menor al esperado", { paymentId, got: payment.amount, expected: reservation.amount });
    return { ok: false as const, reason: "monto incorrecto" };
  }

  await markPaid(reservation.id, "mercadopago", payment.id);
  return { ok: true as const, alreadyPaid: false };
}

export async function markPaid(reservationId: string, via: string, mpPaymentId?: string) {
  const data: Prisma.ReservationUpdateInput = {
    status: "PAID",
    paidAt: new Date(),
    paidVia: via,
    // Un pago confirmado no vence nunca.
    expiresAt: FAR_FUTURE,
  };
  if (mpPaymentId) data.mpPaymentId = mpPaymentId;

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data,
    include: { event: true, seats: true },
  });

  const seats = updated.seats.map((s) => s.number).sort((a, b) => a - b);
  // Los mails no deben tumbar la confirmación si fallan.
  await Promise.allSettled([
    sendReservationConfirmed({
      to: updated.email,
      name: updated.name,
      event: updated.event,
      quantity: updated.quantity,
      seats,
      amount: updated.amount,
      reservationId: updated.id,
    }),
    sendAdminNewReservation({
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      notes: updated.notes,
      event: updated.event,
      quantity: updated.quantity,
      amount: updated.amount,
      via,
    }),
  ]);
  return updated;
}

export async function cancelReservation(reservationId: string) {
  // Al cancelar se liberan las sillas y el cupo. Conservamos la fila como CANCELLED.
  await prisma.$transaction([
    prisma.seat.deleteMany({ where: { reservationId } }),
    prisma.reservation.update({ where: { id: reservationId }, data: { status: "CANCELLED" } }),
  ]);
}

/** Alta manual desde el panel: ya pagada (efectivo/transferencia/invitado), con sillas opcionales. */
export async function createManualReservation(input: {
  eventId: string;
  name: string;
  email: string;
  phone: string | null;
  quantity: number;
  seats: number[];
  via: string;
}) {
  const event = await prisma.event.findUnique({ where: { id: input.eventId } });
  if (!event) throw new ReservationError("Evento inexistente.");
  const quantity = input.seats.length > 0 ? input.seats.length : input.quantity;
  if (quantity < 1) throw new ReservationError("La cantidad tiene que ser al menos 1.");
  if (input.seats.some((n) => n < 1 || n > event.capacity)) {
    throw new ReservationError(`La mesa tiene ${event.capacity} lugares.`);
  }

  await purgeExpiredHolds(event.id);
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${event.id}))`;
      const { paid, holding } = await getOccupancy(event.id, tx);
      const free = event.capacity - paid - holding;
      if (free < quantity) throw new ReservationError(`Quedan ${free} lugares libres, no ${quantity}.`);
      return tx.reservation.create({
        data: {
          eventId: event.id,
          name: input.name,
          email: input.email || "sin-email@local",
          phone: input.phone,
          quantity,
          amount: input.via === "invitado" ? 0 : event.price * quantity,
          status: "PAID",
          paidAt: new Date(),
          paidVia: input.via,
          expiresAt: FAR_FUTURE,
          seatsChosenAt: input.seats.length ? new Date() : null,
          seats: { create: input.seats.map((number) => ({ number, eventId: event.id })) },
        },
      });
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw new ReservationError("Alguno de esos lugares ya está tomado.");
    throw err;
  }
}
