import { SITE_INTRO, SITE_NAME, SITE_TAGLINE, MAX_SEATS_PER_RESERVATION, formatPrice } from "@/lib/config";
import { formatLong, formatTime } from "@/lib/dates";
import { getFreeCount, getNextEvent, getTakenSeats } from "@/lib/reservations";
import { WeekStrip } from "@/components/WeekStrip";
import { ReserveForm } from "@/components/ReserveForm";
import { SubscribeForm } from "@/components/SubscribeForm";
import { MenuSteps } from "@/components/MenuSteps";
import { ResponsiveTableMap, TableLegend, type SeatVisual } from "@/components/TableMap";
import { TrackVisit } from "@/components/TrackVisit";

export const dynamic = "force-dynamic";

export default async function FechasPage() {
  const event = await getNextEvent();
  const [free, taken] = event
    ? await Promise.all([getFreeCount(event.id, event.capacity), getTakenSeats(event.id)])
    : [0, []];
  const takenSet = new Set(taken);
  const states: SeatVisual[] = event
    ? Array.from({ length: event.capacity }, (_, i) => (takenSet.has(i + 1) ? "taken" : "free"))
    : [];

  return (
    <div className="flex flex-1 flex-col">
      <TrackVisit path="/fechas" />
      <header className="mx-auto w-full max-w-3xl px-5 pt-10 pb-6 text-center">
        <p className="eyebrow">{SITE_TAGLINE}</p>
        <h1 className="font-display mt-3 text-5xl sm:text-6xl tracking-tight">{SITE_NAME}</h1>
        <p className="mt-4 text-muted max-w-lg mx-auto leading-relaxed">{SITE_INTRO}</p>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-20 flex flex-col gap-8">
        {event ? (
          <>
            <section className="card p-6 sm:p-8">
              <WeekStrip date={event.date} />
              <div className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl sm:text-4xl">{event.title}</h2>
                  <p className="mt-2 text-lg">
                    {formatLong(event.date)} · {formatTime(event.date)} hs
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl font-semibold">{formatPrice(event.price)}</p>
                  <p className="text-sm text-muted">por persona, todo incluido</p>
                </div>
              </div>
              {event.description && (
                <p className="mt-5 text-ink/90 whitespace-pre-line leading-relaxed">{event.description}</p>
              )}
              {event.menu && (
                <div className="mt-6 border-t border-line pt-6">
                  <p className="eyebrow mb-4">La noche, en pasos</p>
                  <MenuSteps menu={event.menu} />
                </div>
              )}
              <p className="mt-6 text-xs text-muted">La dirección exacta se manda al confirmar la reserva.</p>
            </section>

            <section className="card p-6 sm:p-8">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-2xl">Reservá tu lugar</h3>
                <p className={`text-sm font-medium ${free <= 3 ? "text-danger" : "text-muted"}`}>
                  {free === 0 ? "Sin lugares" : free <= 3 ? "Últimos lugares" : "Pocos lugares"}
                </p>
              </div>
              {free > 0 ? (
                <div className="mt-6">
                  <ReserveForm eventId={event.id} price={event.price} free={free} maxSeats={MAX_SEATS_PER_RESERVATION} />
                </div>
              ) : (
                <p className="mt-6 text-muted">
                  Se llenó. Dejá tu mail abajo y te avisamos si se libera un lugar o cuando haya nueva fecha.
                </p>
              )}
            </section>

            <section className="card p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-display text-2xl">La mesa</h3>
                <p className="text-sm text-muted">Una sola, larga. Tu silla la elegís después de pagar.</p>
              </div>
              <div className="mt-4">
                <ResponsiveTableMap capacity={event.capacity} states={states} />
              </div>
              <div className="mt-2">
                <TableLegend showSelected={false} />
              </div>
            </section>
          </>
        ) : (
          <section className="card p-8 text-center">
            <p className="eyebrow">Próximamente</p>
            <h2 className="font-display mt-3 text-3xl">Todavía no hay fecha</h2>
            <p className="mt-3 text-muted">Dejá tu mail y sos de los primeros en enterarte.</p>
          </section>
        )}

        <section className="card p-6 sm:p-8">
          <h3 className="font-display text-2xl">Avisame cuando haya nueva fecha</h3>
          <p className="mt-2 text-sm text-muted">Un mail por cena, nada más. Te podés bajar cuando quieras.</p>
          <SubscribeForm />
        </section>
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        {SITE_NAME} · {SITE_TAGLINE}
      </footer>
    </div>
  );
}
