import { prisma } from "./prisma";
import { sendReminder, sendReviewRequests } from "./email";
import { notifyWaitlist } from "./waitlist";
import { isEmailConfigured } from "./mailer";
import { ensureFixedEntries } from "./fixed-expenses";
import { ensureNextDraft } from "./events";

const H = 60 * 60 * 1000;

/**
 * Tareas del día. Corre una vez por día (cron de Vercel) y es idempotente:
 * - recordatorio a quienes pagaron una cena que es dentro de las próximas 40 horas (una sola vez por reserva);
 * - pedido de opiniones para cenas que pasaron hace entre 12 h y 4 días (una sola vez por cena);
 * - gastos fijos de la semana, por si nadie abrió el panel;
 * - un borrador de la cena de la semana siguiente si la última ya pasó y no hay ninguna cargada.
 */
export async function runDailyTasks(now = new Date()) {
  const out = { reminders: 0, remindersFailed: 0, reviewRequests: 0, fixed: 0, waitlistNotified: 0, draft: null as string | null };

  out.fixed = await ensureFixedEntries();
  out.draft = await ensureNextDraft(now);

  if (!isEmailConfigured()) return { ...out, note: "mails no configurados" };

  // Recordatorios: cenas entre ahora y 40 h (con el cron a las 11 de la mañana, alcanza a la del día siguiente).
  const soon = await prisma.reservation.findMany({
    where: {
      status: "PAID",
      remindedAt: null,
      event: { date: { gt: now, lt: new Date(now.getTime() + 40 * H) } },
    },
    include: { event: true, seats: { orderBy: { number: "asc" } } },
  });
  for (const r of soon) {
    const res = await sendReminder({
      to: r.email,
      name: r.name,
      event: r.event,
      quantity: r.quantity,
      seats: r.seats.map((s) => s.number),
      reservationId: r.id,
    });
    if (res.skipped || !res.error) {
      await prisma.reservation.update({ where: { id: r.id }, data: { remindedAt: now } });
      if (!res.skipped) out.reminders++;
    } else out.remindersFailed++;
  }

  // Opiniones: cenas que ya pasaron y todavía no pidieron opinión.
  const past = await prisma.event.findMany({
    where: {
      reviewsRequestedAt: null,
      date: { lt: new Date(now.getTime() - 12 * H), gt: new Date(now.getTime() - 4 * 24 * H) },
    },
    include: { reservations: { where: { status: "PAID" } } },
  });
  const next = past.length
    ? await prisma.event.findFirst({ where: { published: true, date: { gt: now } }, orderBy: { date: "asc" }, select: { id: true, title: true, date: true } })
    : null;
  for (const e of past) {
    const people = e.reservations.filter((r) => !r.email.endsWith("@local"));
    const { sent, failed } = await sendReviewRequests({
      event: e,
      people: people.map((r) => ({ id: r.id, name: r.name, email: r.email })),
      next,
    });
    // Si no salió ninguno (mail caído), queda pendiente y se reintenta mañana.
    if (people.length === 0 || sent > 0 || failed === 0) {
      await prisma.event.update({ where: { id: e.id }, data: { reviewsRequestedAt: now } });
    }
    out.reviewRequests += sent;
  }

  // Lugares que se liberaron (holds de transferencia vencidos, cancelaciones): avisar a la lista de espera.
  const upcomingIds = await prisma.event.findMany({ where: { published: true, date: { gt: now } }, select: { id: true } });
  for (const e of upcomingIds) {
    out.waitlistNotified += await notifyWaitlist(e.id).catch(() => 0);
  }

  return out;
}
