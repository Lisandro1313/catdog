import { CopyButton } from "@/components/CopyButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { confirmPaymentById, getTakenSeats } from "@/lib/reservations";
import { isMercadoPagoConfigured } from "@/lib/mp";
import { CONTACT_PHONES, SITE_NAME, formatPhone, formatPrice, siteUrl, whatsappUrl } from "@/lib/config";
import { formatDayNumber, formatLong, formatTime, formatWeekday, nowMs } from "@/lib/dates";
import { googleCalendarUrl } from "@/lib/calendar";
import { getPaymentConfig } from "@/lib/payment";
import { formatLong as formatLongDate } from "@/lib/dates";
import { SeatChooser } from "@/components/SeatChooser";
import { TransferForm } from "@/components/TransferForm";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const include = { event: true, seats: { orderBy: { number: "asc" as const } }, review: { select: { id: true } } };

export default async function ReservationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const paymentId = typeof sp.payment_id === "string" ? sp.payment_id : null;
  const confirming = sp.confirmo === "1";

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

  // "Confirmo que voy" desde el mail del día anterior: un toque, sin login.
  if (confirming && reservation.status === "PAID" && !reservation.confirmedAt) {
    await prisma.reservation.update({ where: { id }, data: { confirmedAt: new Date() } });
    reservation = (await prisma.reservation.findUnique({ where: { id }, include })) ?? reservation;
  }

  const payment = await getPaymentConfig();
  // Reserva hecha para pagar por transferencia: no tiene link de Mercado Pago.
  const byTransfer = reservation.status === "PENDING" && !reservation.mpInitPoint;
  const transferMsg = `Hola! Soy ${reservation.name}. Reservé ${reservation.quantity === 1 ? "1 lugar" : `${reservation.quantity} lugares`} para ${reservation.event.title} (${formatLongDate(reservation.event.date)}) y les mando el comprobante de la transferencia de ${formatPrice(reservation.amount)}. Mi reserva: ${siteUrl()}/reserva/${reservation.id}`;

  const mine = reservation.seats.map((s) => s.number);
  const expired = reservation.status === "PENDING" && reservation.expiresAt.getTime() < nowMs();
  const upcoming = reservation.event.date.getTime() > nowMs();
  const othersTaken =
    reservation.status === "PAID"
      ? (await getTakenSeats(reservation.eventId)).filter((n) => !mine.includes(n))
      : [];
  const reservationUrl = `${siteUrl()}/reserva/${reservation.id}`;
  const shareText = `Tengo lugar para la cena a puertas cerradas del ${formatLong(reservation.event.date)}, ${formatTime(reservation.event.date)} hs${
    reservation.event.address ? `, en ${reservation.event.address}` : ""
  }. ${reservation.quantity > 1 ? "Venís conmigo 🙂 " : ""}Mirá de qué va: ${siteUrl()}`;

  return (
    <div className="flex flex-1 flex-col items-center px-5 py-12 sm:py-16">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="card p-8 text-center">
          <p className="eyebrow">{SITE_NAME}</p>

          {reservation.status === "PAID" && (
            <>
              {confirming && reservation.confirmedAt && (
                <p className="mx-auto mb-4 inline-block rounded-full border border-ok/50 bg-ok/10 px-4 py-1.5 text-sm text-ok">
                  ✓ Gracias por confirmar, te esperamos
                </p>
              )}
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
                  <p className="mt-1 text-xs text-muted">Casa sin cartel: portón, pasillo y puerta. Llegá {formatTime(reservation.event.date)} hs.</p>
                </div>
              )}
              {upcoming && (
                <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
                  <a
                    className="btn btn-ghost btn-sm"
                    href={googleCalendarUrl(reservation.event, reservationUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    + Google Calendar
                  </a>
                  <a className="btn btn-ghost btn-sm" href={`/reserva/${reservation.id}/calendario`}>
                    + Apple / otro calendario
                  </a>
                  <a
                    className="btn btn-ghost btn-sm"
                    href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {reservation.quantity > 1 ? "Avisar a los que vienen" : "Contarle a alguien"}
                  </a>
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

          {byTransfer && !expired && (
            <>
              <h1 className="font-display mt-3 text-3xl">Tu lugar está guardado</h1>
              <p className="mt-3 text-muted">
                {reservation.quantity === 1 ? "1 lugar" : `${reservation.quantity} lugares`} para <strong className="text-ink">{reservation.event.title}</strong>,{" "}
                {formatLong(reservation.event.date)}, a nombre de {reservation.name}. Te lo guardamos hasta el{" "}
                <strong className="text-ink">
                  {formatLong(reservation.expiresAt).toLowerCase()} a las {formatTime(reservation.expiresAt)} hs
                </strong>
                .
              </p>
              <div className="mt-6 rounded-xl bg-surface-2 p-5 text-left">
                <p className="eyebrow">Para confirmarlo, transferí</p>
                <p className="mt-1 flex items-center gap-3 font-display text-3xl">
                  {formatPrice(reservation.amount)}
                  <CopyButton text={String(reservation.amount)} label="Copiar monto" />
                </p>
                <dl className="mt-3 grid gap-1 text-sm">
                  {payment.alias && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Alias / CBU</dt>
                      <dd className="flex items-center justify-end gap-2 text-right font-mono">
                        {payment.alias}
                        <CopyButton text={payment.alias} label="Copiar alias" />
                      </dd>
                    </div>
                  )}
                  {payment.holder && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Titular</dt>
                      <dd className="text-right">{payment.holder}</dd>
                    </div>
                  )}
                  {payment.bank && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Banco</dt>
                      <dd className="text-right">{payment.bank}</dd>
                    </div>
                  )}
                </dl>
                {!payment.alias && <p className="mt-2 text-sm text-danger">Todavía no cargamos los datos de la cuenta: escribinos por WhatsApp y te los pasamos.</p>}
              </div>
              <p className="mt-5 text-sm text-muted">
                Después mandanos el comprobante por WhatsApp. Lo confirmamos en el día: te llega el mail con la dirección exacta y elegís tu silla. Te mandamos estos datos también por
                mail.
              </p>
              {CONTACT_PHONES.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {CONTACT_PHONES.map((p, i) => (
                    <a
                      key={p}
                      className={`btn ${i === 0 ? "btn-primary" : "btn-ghost"}`}
                      href={whatsappUrl(p, transferMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Mandar comprobante · {formatPhone(p)}
                    </a>
                  ))}
                </div>
              )}
              <p className="mt-6 text-xs text-muted">Guardá este link: acá vas a ver tu reserva confirmada y elegir tu lugar.</p>
            </>
          )}

          {reservation.status === "PENDING" && !expired && !byTransfer && (
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
                  ? byTransfer
                    ? "Pasó el tiempo que guardábamos el lugar y no vimos la transferencia. Si la hiciste, mandanos el comprobante por WhatsApp y lo confirmamos igual, si queda lugar."
                    : "Pasaron los 30 minutos sin pago y el cupo volvió a quedar libre."
                  : "Si pagaste y esto es un error, escribinos."}
              </p>
              <Link href="/" className="btn btn-ghost mt-8">
                Volver al inicio
              </Link>
            </>
          )}
        </div>

        {reservation.status === "PAID" && !upcoming && (
          <div className="card p-6 text-center">
            <p className="font-display text-2xl">{reservation.review ? "Gracias por tu opinión" : "¿Cómo la pasaste?"}</p>
            <p className="mt-2 text-sm text-muted">
              {reservation.review ? "Podés editarla cuando quieras." : "Contanos en dos minutos: nos ayuda con las próximas cenas."}
            </p>
            <Link href={`/opinar/${reservation.id}`} className="btn btn-primary mt-5">
              {reservation.review ? "Ver o editar" : "Dejar mi opinión"}
            </Link>
          </div>
        )}

        {reservation.status === "PAID" && upcoming && (
          <div className="card p-6">
            <p className="eyebrow">Esa noche</p>
            <ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
              <li>
                <span className="text-ink">Llegá {formatTime(reservation.event.date)} hs.</span> Es una casa sin cartel: portón, pasillo y puerta.
              </li>
              <li>
                <span className="text-ink">Te recibimos con un cóctel sin alcohol</span> de la casa, de pie, mientras llegan todos.
              </li>
              <li>
                <span className="text-ink">La cena está paga.</span> Lo que quieras tomar además, de la barra, se paga esa noche.
              </li>
              <li>
                <span className="text-ink">¿Alergias o algo que tengamos que saber?</span>{" "}
                {reservation.notes ? `Ya lo tenemos anotado: “${reservation.notes}”.` : `Avisanos por WhatsApp antes del ${formatWeekday(new Date(reservation.event.date.getTime() - 24 * 60 * 60 * 1000))}.`}
              </li>
            </ul>
          </div>
        )}

        {reservation.status === "PAID" && upcoming && (
          <ol className="grid gap-2 text-sm sm:grid-cols-3">
            <Next n="1" done={mine.length > 0} text={mine.length > 0 ? "Silla elegida" : "Elegí tu silla acá abajo"} />
            <Next n="2" text="Guardá este link: tiene la dirección y tu lugar" />
            <Next n="3" text={`El ${formatWeekday(reservation.event.date)} ${formatDayNumber(reservation.event.date)}, ${formatTime(reservation.event.date)} hs. Se recibe con un cóctel sin alcohol de la casa`} />
          </ol>
        )}

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
            {upcoming && (
              <div className="mt-8 border-t border-line pt-5">
                <TransferForm reservationId={reservation.id} currentName={reservation.name} />
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

function Next({ n, text, done }: { n: string; text: string; done?: boolean }) {
  return (
    <li className={`flex items-start gap-3 rounded-xl border border-line px-4 py-3 ${done ? "bg-surface-2 text-muted" : "bg-surface"}`}>
      <span className={`font-display text-lg ${done ? "text-ok" : "text-accent"}`}>{done ? "✓" : n}</span>
      <span className="leading-snug">{text}</span>
    </li>
  );
}
