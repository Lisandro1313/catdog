import { prisma } from "./prisma";

/** Cuánto después del inicio de la cena se puede opinar (tres horas: ya comieron). */
const OPEN_AFTER_MS = 3 * 60 * 60 * 1000;

export type ReviewRow = { id: string; name: string; rating: number; text: string; eventTitle: string };

/** Opiniones aprobadas para el home, las más nuevas primero. */
export async function getApprovedReviews(limit = 6): Promise<ReviewRow[]> {
  const rows = await prisma.review.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { event: { select: { title: true } } },
  });
  return rows.map((r) => ({ id: r.id, name: r.name, rating: r.rating, text: r.text, eventTitle: r.event.title }));
}

export async function getAverageRating(): Promise<{ avg: number; count: number } | null> {
  const agg = await prisma.review.aggregate({ where: { approved: true }, _avg: { rating: true }, _count: true });
  if (!agg._count) return null;
  return { avg: Math.round((agg._avg.rating ?? 0) * 10) / 10, count: agg._count };
}

/** Si la reserva puede opinar: pagó y la cena ya pasó. */
export function canReview(reservation: { status: string; event: { date: Date } }, now = Date.now()): boolean {
  return reservation.status === "PAID" && reservation.event.date.getTime() + OPEN_AFTER_MS < now;
}

/** "Lisandro E." a partir de "Lisandro Etcheverry": nombre y la inicial del apellido. */
export function displayName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}
