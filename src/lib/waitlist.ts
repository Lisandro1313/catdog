import { prisma } from "./prisma";
import { getFreeCount } from "./reservations";
import { sendMany, isEmailConfigured } from "./mailer";
import { renderSeatFreed } from "./email";

/**
 * Lista de espera de una fecha agotada. Cuando se libera un lugar (cancelación, reserva vencida o borrada),
 * les avisamos por mail a todos los anotados que todavía no recibieron aviso: el que llega primero, reserva.
 */
export async function joinWaitlist(eventId: string, email: string, name: string | null, quantity: number) {
  await prisma.waitlist.upsert({
    where: { eventId_email: { eventId, email } },
    update: { name: name ?? undefined, quantity, notifiedAt: null },
    create: { eventId, email, name, quantity },
  });
}

export async function getWaitlistCount(eventId: string): Promise<number> {
  return prisma.waitlist.count({ where: { eventId } });
}

/** Si la cena tiene lugar y hay anotados sin avisar, manda el mail y los marca. Devuelve cuántos avisó. */
export async function notifyWaitlist(eventId: string): Promise<number> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || !event.published || event.closedAt || event.date.getTime() < Date.now()) return 0;
  const free = await getFreeCount(event.id, event.capacity);
  if (free <= 0) return 0;
  const waiting = await prisma.waitlist.findMany({ where: { eventId, notifiedAt: null }, orderBy: { createdAt: "asc" } });
  const people = waiting.filter((w) => !w.email.endsWith("@local"));
  if (people.length === 0 || !isEmailConfigured()) return 0;
  const { sent } = await sendMany(people.map((w) => ({ to: w.email, ...renderSeatFreed(event, w.name, free) })));
  await prisma.waitlist.updateMany({ where: { id: { in: people.map((w) => w.id) } }, data: { notifiedAt: new Date() } });
  return sent;
}
