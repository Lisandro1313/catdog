import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cupos: lo que nunca puede fallar. Se prueba con un Prisma simulado (sin base), porque la real es compartida.
 */
// vi.hoisted: el doble se crea antes de que se levante el mock (vi.mock se mueve al principio del archivo).
const db = vi.hoisted(() => ({
  event: { findMany: vi.fn(), findUnique: vi.fn() },
  reservation: { groupBy: vi.fn(), aggregate: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findUniqueOrThrow: vi.fn(), create: vi.fn(), findFirst: vi.fn(), count: vi.fn(), deleteMany: vi.fn() },
  subscriber: { upsert: vi.fn().mockResolvedValue(null) },
  $transaction: vi.fn(),
  $executeRaw: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/email", () => ({
  sendHoldPending: vi.fn().mockResolvedValue({}),
  sendAdminNewReservation: vi.fn().mockResolvedValue(undefined),
  sendReservationConfirmed: vi.fn().mockResolvedValue({ skipped: true }),
  sendGiftCard: vi.fn().mockResolvedValue({ skipped: true }),
}));
vi.mock("@/lib/mp", () => ({ createPreference: vi.fn(), getPayment: vi.fn(), isMercadoPagoConfigured: () => false }));
vi.mock("@/lib/payment", () => ({ getPaymentConfig: vi.fn().mockResolvedValue({ mode: "transferencia", alias: "a", holder: "b", bank: "", holdHours: 24 }) }));

import { ReservationError, getUpcomingEvents, markPaid } from "@/lib/reservations";

const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

beforeEach(() => {
  vi.clearAllMocks();
  // La transacción ejecuta el callback con el mismo doble.
  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db));
  db.$executeRaw.mockResolvedValue(0);
});

describe("getUpcomingEvents", () => {
  it("descuenta pagos y holds vigentes, y con reservas cerradas deja 0", async () => {
    db.event.findMany.mockResolvedValue([
      { id: "a", capacity: 15, closedAt: null, date: future },
      { id: "b", capacity: 15, closedAt: new Date(), date: future },
      { id: "c", capacity: 15, closedAt: null, date: future },
    ]);
    db.reservation.groupBy.mockResolvedValue([
      { eventId: "a", _sum: { quantity: 12 } },
      { eventId: "b", _sum: { quantity: 2 } },
    ]);
    const list = await getUpcomingEvents();
    expect(list.map((e) => e.free)).toEqual([3, 0, 15]);
    // una sola consulta de ocupación, no una por fecha
    expect(db.reservation.groupBy).toHaveBeenCalledTimes(1);
  });

  it("nunca devuelve libres negativos", async () => {
    db.event.findMany.mockResolvedValue([{ id: "a", capacity: 10, closedAt: null, date: future }]);
    db.reservation.groupBy.mockResolvedValue([{ eventId: "a", _sum: { quantity: 14 } }]);
    const [e] = await getUpcomingEvents();
    expect(e.free).toBe(0);
  });
});

describe("markPaid", () => {
  const base = { id: "r1", eventId: "ev", quantity: 2, email: "ana@x.com", name: "Ana", notes: null, phone: null, amount: 60000, giftName: null, giftEmail: null, giftMessage: null };

  it("rechaza una reserva cancelada", async () => {
    db.reservation.findUnique.mockResolvedValue({ ...base, status: "CANCELLED", expiresAt: future, event: { capacity: 15 } });
    await expect(markPaid("r1", "transferencia")).rejects.toBeInstanceOf(ReservationError);
    expect(db.reservation.update).not.toHaveBeenCalled();
  });

  it("si el hold venció y ya no hay lugar, no confirma (no sobrevende)", async () => {
    db.reservation.findUnique.mockResolvedValue({ ...base, status: "PENDING", expiresAt: new Date(Date.now() - 1000), event: { capacity: 15 } });
    db.reservation.aggregate.mockResolvedValueOnce({ _sum: { quantity: 14 } }).mockResolvedValueOnce({ _sum: { quantity: 0 } });
    await expect(markPaid("r1", "transferencia")).rejects.toThrow(/venció/);
    expect(db.reservation.update).not.toHaveBeenCalled();
  });

  it("si el hold venció pero queda lugar, confirma", async () => {
    db.reservation.findUnique.mockResolvedValue({ ...base, status: "PENDING", expiresAt: new Date(Date.now() - 1000), event: { capacity: 15 } });
    db.reservation.aggregate.mockResolvedValueOnce({ _sum: { quantity: 10 } }).mockResolvedValueOnce({ _sum: { quantity: 0 } });
    db.reservation.update.mockResolvedValue({ ...base, status: "PAID", event: { capacity: 15, title: "Cena", date: future, price: 30000 }, seats: [] });
    const r = await markPaid("r1", "transferencia");
    expect(r.status).toBe("PAID");
    expect(db.reservation.update).toHaveBeenCalledTimes(1);
  });

  it("una reserva ya paga no se vuelve a marcar", async () => {
    db.reservation.findUnique.mockResolvedValue({ ...base, status: "PAID", expiresAt: future, event: { capacity: 15 } });
    db.reservation.findUniqueOrThrow.mockResolvedValue({ ...base, status: "PAID", event: { capacity: 15, title: "Cena", date: future, price: 30000 }, seats: [] });
    await markPaid("r1", "efectivo");
    expect(db.reservation.update).not.toHaveBeenCalled();
  });
});
