import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MAX_SEATS_PER_RESERVATION, SITE_NAME, formatPrice } from "@/lib/config";
import { formatDayNumber, formatMonth, formatTime, formatWeekday } from "@/lib/dates";
import { parseBar, parseMenu } from "@/lib/menu";
import { getFreeCount } from "@/lib/reservations";
import { getPaymentConfig } from "@/lib/payment";
import { ReserveForm } from "@/components/ReserveForm";
import { BarList } from "@/components/BarList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: `Cena privada · ${SITE_NAME}`, robots: { index: false, follow: false } };

/**
 * Cena privada / a pedido: no está en el home ni en /fechas, solo llega quien tiene el link.
 * Misma reserva de siempre, pero para esta fecha nada más.
 */
export default async function PrivadaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, payment] = await Promise.all([prisma.event.findUnique({ where: { id } }), getPaymentConfig()]);
  if (!event || !event.unlisted || !event.published) notFound();

  const free = event.closedAt ? 0 : await getFreeCount(event.id, event.capacity);
  const past = event.date.getTime() < Date.now();
  const steps = parseMenu(event.menu);
  const bar = parseBar(event.bar);
  const dateLong = `${formatWeekday(event.date)} ${formatDayNumber(event.date)} de ${formatMonth(event.date)}, ${formatTime(event.date)} hs`;

  return (
    <div className="ap mx-auto w-full max-w-xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="text-center">
        <p className="ap-eyebrow">{SITE_NAME} · cena privada</p>
        <h1 className="ap-display mt-4 text-4xl sm:text-5xl">{event.title}</h1>
        <p className="mt-4 text-muted">{dateLong}</p>
        <p className="mt-1 text-sm text-muted">{formatPrice(event.price)} por persona · solo con este link</p>
        {event.description && <p className="mx-auto mt-6 max-w-md whitespace-pre-line text-sm leading-relaxed text-muted">{event.description}</p>}
      </div>

      {steps.length > 0 && (
        <div className="menu-card mt-10">
          <p className="ap-eyebrow text-center">La carta</p>
          <ol className="mt-6">
            {steps.map((s, i) => (
              <li key={i} className="ap-step">
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span className="dish">{s.dish}</span>
                {s.drink && <span className="drink">{s.drink}</span>}
              </li>
            ))}
          </ol>
          {bar.length > 0 && (
            <div className="mt-8 border-t border-accent/15 pt-6">
              <BarList items={bar} price={event.barPrice} />
            </div>
          )}
        </div>
      )}

      <section id="reservar" className="card-gold mt-10 rounded-2xl p-6 sm:p-8">
        {past ? (
          <p className="text-center text-muted">Esta cena ya pasó.</p>
        ) : free <= 0 ? (
          <p className="text-center text-muted">{event.closedAt ? "Las reservas de esta cena están cerradas." : "Esta cena ya está completa."}</p>
        ) : (
          <>
            <p className="ap-eyebrow text-center">Reservá tu lugar</p>
            <div className="mt-4">
              <ReserveForm
                events={[{ id: event.id, short: `${formatWeekday(event.date)} ${formatDayNumber(event.date)}`, long: dateLong, price: event.price, free }]}
                defaultEventId={event.id}
                maxSeats={MAX_SEATS_PER_RESERVATION}
                byTransfer={payment.mode === "transferencia"}
                holdHours={payment.holdHours}
              />
            </div>
          </>
        )}
      </section>

      <p className="mt-8 text-center text-xs text-muted">
        <Link href="/condiciones" className="underline underline-offset-4 hover:text-ink">
          Condiciones y privacidad
        </Link>
      </p>
    </div>
  );
}
