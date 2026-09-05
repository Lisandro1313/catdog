import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { confirmPaymentById, getTakenSeats } from "@/lib/reservations";
import { isMercadoPagoConfigured } from "@/lib/mp";
import { CONTACT_PHONES, SITE_NAME, formatPhone, formatPrice, whatsappUrl } from "@/lib/config";
import { formatLong, formatTime, nowMs } from "@/lib/dates";
import { SeatChooser } from "@/components/SeatChooser";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const include = { event: true, seats: { orderBy: { number: "asc" as const } } };

export default async function ReservationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const paymentId = typeof sp.payment_id === "string" ? sp.payment_id : null;

  let reservation = await prisma.reservation.findUnique({ where: { id }, include });
  if (!reservation) notFound();

  // Al volver de Mercado Pago confirmamos acá también, por si el webhook todavía no llegó.
  if (reservation.status === "PENDING" && paymentId && paymentId !== "null" && isMercadoPagoConfigured()) {
    try {
      await confirmPaymentById(paymentId);
    } catch (err) {
      console.error("[reserva] confirmación al volver falló", err);
    }
    reservation = await prisma.reservation.findUnique({ where: { id }, include });
    if (!reservation) notFound();
  }

  const mine = reservation.seats.map((s) => s.number);
  const expired = reservation.status === "PENDING" && reservation.expiresAt.getTime() < nowMs();
  const upcoming = reservation.event.date.getTime() > nowMs();
  const othersTaken =
    reservation.status === "PAID"
      ? (await getTakenSeats(reservation.eventId)).filter((n) => !mine.includes(n))
      : [];

  return (
    <div className="flex flex-1 flex-col items-center px-5 py-12 sm:py-16">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="card p-8 text-center">
          <p className="eyebrow">{SITE_NAME}</p>

          {reservation.status === "PAID" && (
            <>
              <h1 className="font-display mt-3 text-4xl">¡Reserva confirmada!</h1>
              <p className="mt-4 text-lg">
                {formatLong(reservation.event.date)} · {formatTime(reservation.event.date)} hs
              </p>
              <p className="mt-1 text-muted">{reservation.event.title}</p>
              <p className="mt-4 text-sm text-muted">
                {reservation.quantity === 1 ? "1 lugar" : `${reservation.quantity} lugares`} a nombre de{" "}
                <strong className="text-ink">{reservation.name}</strong>.
                {reservation.email !== "sin-email@local" && ` Te mandamos la confirmación a ${reservation.email}.`}
              </p>
              {reservation.event.address && (
                <div className="mt-6 rounded-xl bg-surface-2 p-4">
                  <p className="eyebrow">Dónde</p>
                  <p className="mt-1 font-display text-xl">{reservation.event.address}</p>
                </div>
              )}
              {CONTACT_PHONES.length > 0 && (
                <div className="mt-4 text-sm text-muted">
                  <p>Consultas por WhatsApp:</p>
                  <p className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1">
                    {CONTACT_PHONES.map((p) => (
                      <a
                        key={p}
                        className="text-accent hover:text-accent-strong"
                        href={whatsappUrl(p, `Hola! Tengo una consulta por mi reserva para ${reservation.event.title} (${reservation.name}).`)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {formatPhone(p)}
                      </a>
                    ))}
                  </p>
                </div>
              )}
            </>
          )}

          {reservation.status === "PENDING" && !expired && (
            <>
              <h1 className="font-display mt-3 text-3xl">Todavía no recibimos el pago</h1>
              <p className="mt-4 text-muted">
                Si ya pagaste, dale unos segundos y recargá esta página. Tu cupo de{" "}
                <strong className="text-ink">
                  {reservation.quantity} lugar{reservation.quantity > 1 ? "es" : ""}
                </strong>{" "}
                queda guardado hasta las {formatTime(reservation.expiresAt)} hs.
              </p>
              {reservation.mpInitPoint && (
                <a className="btn btn-primary mt-6" href={reservation.mpInitPoint}>
                  Pagar {formatPrice(reservation.amount)}
                </a>
              )}
            </>
          )}

          {(expired || reservation.status === "CANCELLED") && (
            <>
              <h1 className="font-display mt-3 text-3xl">
                {expired ? "La reserva venció" : "La reserva fue cancelada"}
              </h1>
              <p className="mt-4 text-muted">
                {expired
                  ? "Pasaron los 30 minutos sin pago y el cupo volvió a quedar libre."
                  : "Si pagaste y esto es un error, escribinos."}
              </p>
              <Link href="/" className="btn btn-ghost mt-8">
                Volver al inicio
              </Link>
            </>
          )}
        </div>

        {reservation.status === "PAID" && (
          <div className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl">
                {mine.length === 0 ? "Elegí tu lugar en la mesa" : "Tu lugar en la mesa"}
              </h2>
              {mine.length > 0 && <p className="font-display text-2xl text-accent">{mine.join(" · ")}</p>}
            </div>
            <p className="mt-2 text-sm text-muted">
              {mine.length === 0
                ? reservation.quantity === 1
                  ? "Tocá una silla libre y confirmá."
                  : `Tocá ${reservation.quantity} sillas libres y confirmá.`
                : upcoming
                  ? "Podés cambiarlo hasta el día de la cena, si hay lugar."
                  : "Gracias por venir."}
            </p>
            {upcoming && (
              <div className="mt-6">
                <SeatChooser
                  reservationId={reservation.id}
                  capacity={reservation.event.capacity}
                  taken={othersTaken}
                  mine={mine}
                  quantity={reservation.quantity}
                />
              </div>
            )}
            <div className="mt-8 border-t border-line pt-5 text-center">
              <Link href="/" className="text-sm text-muted hover:text-ink">
                ← Volver al inicio
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
