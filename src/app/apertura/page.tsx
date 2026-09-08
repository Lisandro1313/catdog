import type { Metadata } from "next";
import Link from "next/link";
import { MAX_SEATS_PER_RESERVATION, SITE_NAME, formatPrice } from "@/lib/config";
import { formatDayNumber, formatMonth, formatTime, formatWeekday, weekOf } from "@/lib/dates";
import { getFreeCount, getNextEvent } from "@/lib/reservations";
import { parseMenu } from "@/lib/menu";
import { ReserveForm } from "@/components/ReserveForm";
import { SubscribeForm } from "@/components/SubscribeForm";
import { TrackVisit } from "@/components/TrackVisit";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const event = await getNextEvent();
  const title = event ? `Apertura · ${formatWeekday(event.date)} ${formatDayNumber(event.date)} de ${formatMonth(event.date)}` : `Apertura · ${SITE_NAME}`;
  const description = event
    ? `Cena a puertas cerradas en La Plata. Cinco pasos, cada plato con su trago pensado al lado. ${formatPrice(event.price)} por persona, pocos lugares.`
    : "Cena a puertas cerradas en La Plata.";
  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function AperturaPage() {
  const event = await getNextEvent();
  const free = event ? await getFreeCount(event.id, event.capacity) : 0;
  const steps = parseMenu(event?.menu);

  if (!event) {
    return (
      <div className="ap flex flex-1 items-center justify-center px-6 py-24 text-center">
        <div>
          <p className="ap-eyebrow">{SITE_NAME}</p>
          <h1 className="ap-display mt-4 text-5xl">Todavía no hay fecha</h1>
          <p className="mt-4 text-muted">Dejá tu mail y sos de los primeros en enterarte.</p>
          <div className="mx-auto mt-6 max-w-sm text-left">
            <SubscribeForm />
          </div>
        </div>
      </div>
    );
  }

  const { daysUntil } = weekOf(event.date);
  const countdown = daysUntil === 0 ? "Es esta noche" : daysUntil === 1 ? "Es mañana" : daysUntil > 1 ? `Faltan ${daysUntil} días` : null;

  // Sin números: la cantidad exacta de lugares no se muestra en esta pantalla.
  const scarcity =
    free <= 3 ? { label: "últimos lugares", tone: "text-danger" } : { label: "pocos lugares", tone: "text-muted" };

  return (
    <div className="ap flex flex-1 flex-col pb-24 sm:pb-0">
      <TrackVisit path="/apertura" />

      {/* Afiche */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden px-6 py-20">
        <div className="ap-backdrop" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={i}>{s.dish}</span>
          ))}
        </div>

        <div className="ap-spot relative z-10 mx-auto w-full max-w-2xl text-center">
          <p className="ap-eyebrow">Cena a puertas cerradas · La Plata</p>

          <h1 className="ap-display mt-6 text-[clamp(3.4rem,17vw,7.5rem)]">Apertura</h1>

          <hr className="ap-rule-gold mx-auto mt-8 w-40" />

          <div className="ap-date mt-8">
            <span className="word">{formatWeekday(event.date)}</span>
            <span className="num">{formatDayNumber(event.date)}</span>
            <span className="word">{formatMonth(event.date)}</span>
          </div>
          <p className="mt-3 text-sm tracking-[0.2em] uppercase text-muted">
            {formatTime(event.date)} hs
            {countdown && <span className="text-accent"> · {countdown}</span>}
          </p>

          <hr className="ap-rule mx-auto mt-8 w-56" />

          <p className="mt-8 font-display text-2xl sm:text-3xl">{event.title}</p>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
            {steps.length > 0
              ? `${spellOut(steps.length)} pasos, cada plato con su trago pensado al lado. Una noche, no un restaurante.`
              : "Una noche, no un restaurante."}
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
            {free > 0 ? (
              <>
                <a className="btn btn-primary px-8" href="#reservar">
                  Reservar mi lugar
                </a>
                <p className="text-sm text-muted">
                  {formatPrice(event.price)} por persona ·{" "}
                  <span className={scarcity.tone}>{scarcity.label}</span>
                </p>
              </>
            ) : (
              <p className="text-danger">Se agotó.</p>
            )}
          </div>
        </div>
      </section>

      {/* La carta */}
      {steps.length > 0 && (
        <section className="mx-auto w-full max-w-xl px-6 py-14">
          <div className="text-center">
            <p className="ap-eyebrow">La carta de la noche</p>
            <p className="mt-3 text-sm text-muted">
              Cada paso sale de la cocina con su trago pensado al lado. Hay versión sin alcohol de todos.
            </p>
          </div>
          <ol className="mt-8">
            {steps.map((s, i) => (
              <li key={i} className="ap-step">
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span className="dish">{s.dish}</span>
                {s.drink && <span className="drink">{s.drink}</span>}
              </li>
            ))}
          </ol>
          {event.description && (
            <p className="mt-8 text-center leading-relaxed whitespace-pre-line text-muted">{event.description}</p>
          )}
        </section>
      )}

      {/* Reserva */}
      <section id="reservar" className="mx-auto w-full max-w-xl scroll-mt-8 px-6 py-14">
        <div className="text-center">
          <p className="ap-eyebrow">Tu lugar</p>
          <h2 className="ap-display mt-4 text-4xl sm:text-5xl">Reservá</h2>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Elegís cuántos son y pagás por Mercado Pago. Después elegís tu silla en la mesa y te llega la dirección
            exacta.
          </p>
        </div>

        <div className="card mt-8 p-6 sm:p-8">
          {free > 0 ? (
            <ReserveForm eventId={event.id} price={event.price} free={free} maxSeats={MAX_SEATS_PER_RESERVATION} />
          ) : (
            <div className="text-center">
              <p className="font-display text-2xl">Se agotó</p>
              <p className="mt-2 text-sm text-muted">
                Dejá tu mail: te avisamos si se libera un lugar y cuando abramos la próxima fecha.
              </p>
              <div className="mt-5 text-left">
                <SubscribeForm />
              </div>
            </div>
          )}
        </div>

        <dl className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line text-sm sm:grid-cols-3">
          <Fact label="Dónde" value="La Plata, casco urbano. La dirección exacta se manda al confirmar." />
          <Fact
            label="Cuándo"
            value={`${formatWeekday(event.date)} ${formatDayNumber(event.date)} de ${formatMonth(event.date)}, ${formatTime(event.date)} hs.`}
          />
          <Fact label="Cuánto" value={`${formatPrice(event.price)} por persona. Se paga la reserva completa por Mercado Pago.`} />
        </dl>
      </section>

      <footer className="border-t border-line py-8 text-center text-xs text-muted">
        <p>{SITE_NAME} · Cena a puertas cerradas · La Plata</p>
        <Link href="/" className="mt-2 inline-block hover:text-ink">
          Ver todas las fechas
        </Link>
      </footer>

      {/* Barra fija en el celular */}
      {free > 0 && (
        <div className="ap-cta-bar">
          <div className="leading-tight">
            <p className="font-display text-lg">{formatPrice(event.price)}</p>
            <p className={`text-xs ${scarcity.tone}`}>{scarcity.label}</p>
          </div>
          <a className="btn btn-primary btn-sm px-6" href="#reservar">
            Reservar
          </a>
        </div>
      )}
    </div>
  );
}

/** En un afiche, "cinco pasos" lee mejor que "5 pasos". */
function spellOut(n: number): string {
  const words = ["cero", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const w = words[n] ?? String(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <dt className="ap-eyebrow">{label}</dt>
      <dd className="mt-2 leading-relaxed text-muted">{value}</dd>
    </div>
  );
}
