import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, formatPrice } from "@/lib/config";
import { formatDayNumber, formatMonth, formatTime, formatWeekday } from "@/lib/dates";
import { getUpcomingEvents } from "@/lib/reservations";
import { parseMenu } from "@/lib/menu";
import { SubscribeForm } from "@/components/SubscribeForm";
import { TrackVisit } from "@/components/TrackVisit";

export const revalidate = 60;

export const metadata: Metadata = {
  title: `Próximas fechas · ${SITE_NAME}`,
  description: "Las próximas cenas a puertas cerradas en La Plata: fecha, carta y reserva.",
};

/** Todas las fechas publicadas, la más cercana primero. Sin cupos ni mesa: solo "pocos lugares" / "agotado". */
export default async function FechasPage() {
  const events = await getUpcomingEvents(12);

  return (
    <div className="ap mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
      <TrackVisit path="/fechas" />
      <div className="text-center">
        <p className="ap-eyebrow">{SITE_NAME}</p>
        <h1 className="ap-display mt-3 text-4xl sm:text-5xl">Próximas fechas</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">Los viernes, en una casa de La Plata. Cinco pasos, cada plato con su cóctel de autor.</p>
      </div>

      {events.length === 0 ? (
        <div className="card mt-10 p-6 text-center">
          <p className="font-display text-2xl">Todavía no hay fecha</p>
          <p className="mt-2 text-sm text-muted">Dejá tu mail y sos de los primeros en enterarte.</p>
          <div className="mt-4 text-left">
            <SubscribeForm />
          </div>
        </div>
      ) : (
        <ol className="mt-10 grid gap-4">
          {events.map((e, i) => {
            const steps = parseMenu(e.menu);
            const soldOut = e.free <= 0;
            const tone = soldOut ? "text-danger" : e.free <= 3 ? "text-danger" : "text-muted";
            const label = e.closedAt ? "Reservas cerradas" : soldOut ? "Agotado" : e.free <= 3 ? "Últimos lugares" : "Pocos lugares";
            return (
              <li key={e.id} className={`card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6 ${i === 0 ? "card-gold" : ""}`}>
                <div className="ap-date shrink-0">
                  <span className="word">{formatWeekday(e.date)}</span>
                  <span className="num !text-5xl">{formatDayNumber(e.date)}</span>
                  <span className="word">{formatMonth(e.date)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl">{e.title}</p>
                  <p className="text-sm text-muted">
                    {formatTime(e.date)} hs · {formatPrice(e.price)} por persona · <span className={tone}>{label}</span>
                  </p>
                  {steps.length > 0 && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{steps.map((s) => s.dish).join(" · ")}</p>
                  )}
                </div>
                <div className="shrink-0">
                  {soldOut ? (
                    <span className="btn btn-ghost btn-sm pointer-events-none opacity-60">{e.closedAt ? "Cerrado" : "Agotado"}</span>
                  ) : (
                    <Link href={`/?fecha=${e.id}#reservar`} className="btn btn-primary btn-sm">
                      Reservar
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="card mt-10 p-6">
        <p className="font-display text-xl">¿Te avisamos cuando abramos una nueva?</p>
        <p className="mt-1 text-sm text-muted">Un mail por cena, nada más.</p>
        <SubscribeForm />
      </div>

      <p className="mt-10 text-center">
        <Link href="/" className="text-sm text-muted hover:text-ink">
          ← Volver al inicio
        </Link>
      </p>
    </div>
  );
}
