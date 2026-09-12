import type { Metadata } from "next";
import Link from "next/link";
import { MAX_SEATS_PER_RESERVATION, SITE_NAME, formatPrice } from "@/lib/config";
import { formatDayNumber, formatMonth, formatTime, formatWeekday, weekOf } from "@/lib/dates";
import { getFreeCount, getNextEvent } from "@/lib/reservations";
import { parseBar, parseMenu } from "@/lib/menu";
import { getAbout, getPhotos } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { BarList } from "@/components/BarList";
import { ReserveForm } from "@/components/ReserveForm";
import { SubscribeForm } from "@/components/SubscribeForm";
import { TrackVisit } from "@/components/TrackVisit";
import { PhotoStrip } from "@/components/PhotoStrip";

export const dynamic = "force-dynamic";

/** Zona pública (sin el número): lo que se dice antes de pagar. */
const ZONE = "Calle 66, entre 2 y 3 · La Plata";
/** Centro del mapa: la cuadra, sin marcador (el número exacto no se muestra). */
const MAP_CENTER = "-34.9218,-57.9306";

export async function generateMetadata(): Promise<Metadata> {
  const event = await getNextEvent();
  const title = event
    ? `${formatWeekday(event.date)} ${formatDayNumber(event.date)} de ${formatMonth(event.date)} · Cena a puertas cerradas en La Plata`
    : `Cena a puertas cerradas en La Plata`;
  const description = event
    ? `Una mesa larga en una casa de La Plata. Cinco pasos, cada plato con su trago. ${formatPrice(event.price)} por persona, pocos lugares.`
    : "Una mesa larga en una casa de La Plata. Cinco pasos, cada plato con su trago.";
  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function HomePage() {
  const [event, about, photos, eventCount] = await Promise.all([getNextEvent(), getAbout(), getPhotos(), prisma.event.count()]);
  const free = event ? await getFreeCount(event.id, event.capacity) : 0;
  const steps = parseMenu(event?.menu);
  const bar = parseBar(event?.bar);
  const heroTitle = eventCount <= 1 ? "Apertura" : "Próxima cena";

  const scarcity = free <= 3 ? { label: "últimos lugares", tone: "text-danger" } : { label: "pocos lugares", tone: "text-muted" };
  const countdown = event
    ? (() => {
        const { daysUntil } = weekOf(event.date);
        return daysUntil === 0 ? "Es esta noche" : daysUntil === 1 ? "Es mañana" : daysUntil > 1 ? `Faltan ${daysUntil} días` : null;
      })()
    : null;


  const faqs = [
    {
      q: "¿Qué incluye el precio?",
      a: "Los cinco pasos de la cena, cada uno con el trago que lo acompaña. Lo que quieras tomar además, de la barra, va aparte.",
    },
    {
      q: "¿Puedo ir solo o sola?",
      a: "Sí, y está bueno. Es una mesa larga pensada para compartir: mucha gente viene sola o de a dos y termina charlando con desconocidos.",
    },
    {
      q: "¿Dónde es exactamente?",
      a: `${ZONE}. Es una casa sin cartel: el número exacto te llega con la confirmación de la reserva, por mail y en tu página de reserva.`,
    },
    {
      q: "¿Cómo se paga?",
      a: "Por Mercado Pago al reservar: tarjeta, débito o dinero en cuenta. Mientras pagás, tu cupo queda guardado 30 minutos.",
    },
    {
      q: "¿Comés distinto? ¿Alergias?",
      a: "Contanos al reservar, hay un campo para eso. Lo tenemos en cuenta antes de cocinar.",
    },
    {
      q: "¿Y si no puedo ir?",
      a: "Escribinos con tiempo por el WhatsApp que te llega con la confirmación y lo resolvemos entre todos.",
    },
  ];

  const aboutParagraphs = about.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="ap flex flex-1 flex-col pb-24 sm:pb-0">
      <TrackVisit path="/" />

      {/* Nav de anclas (escritorio) */}
      <nav className="sticky top-0 z-20 hidden border-b border-line/60 bg-bg/85 backdrop-blur sm:block" aria-label="Secciones">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3 text-sm">
          <a href="#inicio" className="font-display text-lg">
            {SITE_NAME}
          </a>
          <div className="flex gap-6 text-muted">
            <a href="#carta" className="hover:text-ink">La carta</a>
            <a href="#nosotros" className="hover:text-ink">Quiénes somos</a>
            <a href="#donde" className="hover:text-ink">Dónde</a>
            <a href="#reservar" className="btn btn-primary btn-sm">Reservar</a>
          </div>
        </div>
      </nav>

      {/* Afiche */}
      <section id="inicio" className="relative flex min-h-[88vh] items-center overflow-hidden px-6 py-20">
        <div className="ap-backdrop" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={i}>{s.dish}</span>
          ))}
        </div>
        <div className="ap-spot relative z-10 mx-auto w-full max-w-2xl text-center">
          <p className="ap-eyebrow">Cena a puertas cerradas · La Plata</p>
          <h1 className="ap-display mt-6 text-[clamp(3.2rem,16vw,7.5rem)]">{heroTitle}</h1>
          <hr className="ap-rule-gold mx-auto mt-8 w-40" />

          {event ? (
            <>
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
                Una casa, una mesa larga y {steps.length > 0 ? `${spellOut(steps.length).toLowerCase()} pasos` : "una cena"}, cada plato con su
                trago pensado al lado. Una noche, no un restaurante.
              </p>
              <div className="mt-10 flex flex-col items-center gap-3">
                {free > 0 ? (
                  <>
                    <a className="btn btn-primary px-8" href="#reservar">
                      Reservar mi lugar
                    </a>
                    <p className="text-sm text-muted">
                      {formatPrice(event.price)} por persona · <span className={scarcity.tone}>{scarcity.label}</span>
                    </p>
                  </>
                ) : (
                  <p className="text-danger">Se agotó.</p>
                )}
              </div>
              <a href="#carta" className="mt-12 inline-block text-xs tracking-[0.2em] uppercase text-muted hover:text-ink">
                ↓ La carta de la noche
              </a>
            </>
          ) : (
            <>
              <p className="mt-8 font-display text-2xl">Todavía no hay fecha</p>
              <p className="mx-auto mt-3 max-w-md text-muted">Dejá tu mail y sos de los primeros en enterarte.</p>
              <div className="mx-auto mt-6 max-w-sm text-left">
                <SubscribeForm />
              </div>
            </>
          )}
        </div>
      </section>

      {event && (
        <>
          {/* La carta */}
          {steps.length > 0 && (
            <section id="carta" className="mx-auto w-full max-w-xl scroll-mt-16 px-6 py-14">
              <div className="text-center">
                <p className="ap-eyebrow">La carta de esta noche</p>
                <h2 className="ap-display mt-3 text-3xl sm:text-4xl">{event.title}</h2>
                <p className="mt-3 text-sm text-muted">Cada paso sale de la cocina con su trago pensado al lado. Hay versión sin alcohol de todos.</p>
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
              {bar.length > 0 && (
                <div className="mt-10 border-t border-line pt-8">
                  <BarList items={bar} price={event.barPrice} />
                </div>
              )}
            </section>
          )}

          {/* Fotos */}
          {photos.length > 0 && (
            <section id="fotos" className="scroll-mt-16 py-10">
              <div className="mx-auto max-w-2xl px-6 text-center">
                <p className="ap-eyebrow">La casa</p>
              </div>
              <div className="mt-6">
                <PhotoStrip photos={photos} />
              </div>
            </section>
          )}

          {/* Quiénes somos */}
          <section id="nosotros" className="mx-auto w-full max-w-2xl scroll-mt-16 px-6 py-16">
            <div className="text-center">
              <p className="ap-eyebrow">Quiénes somos</p>
              <h2 className="ap-display mt-3 text-3xl sm:text-4xl">La casa de la calle 66</h2>
            </div>
            <div className="mx-auto mt-8 max-w-prose space-y-4 text-center leading-relaxed text-ink/90">
              {aboutParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {/* Dónde */}
          <section id="donde" className="mx-auto w-full max-w-2xl scroll-mt-16 px-6 py-14">
            <div className="grid gap-6 sm:grid-cols-[1fr_1fr] sm:items-center">
              <div>
                <p className="ap-eyebrow">Dónde</p>
                <p className="mt-3 font-display text-2xl sm:text-3xl">{ZONE}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Una casa sin cartel en el casco de La Plata. Se entra por un portón y un pasillo, y adentro hay una sola mesa. El número
                  exacto te llega con la confirmación de la reserva.
                </p>
                <p className="mt-3 text-sm text-muted">
                  Llegá <span className="text-ink">{formatTime(event.date)} hs</span>. Se recibe con un trago de pie.
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-line bg-surface-2">
                <iframe
                  title="Mapa de la zona"
                  src={`https://maps.google.com/maps?ll=${MAP_CENTER}&z=16&t=m&output=embed`}
                  className="h-56 w-full sm:h-64"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{ filter: "grayscale(1) invert(0.92) contrast(0.9) brightness(0.9)" }}
                />
              </div>
            </div>
          </section>

          {/* Preguntas */}
          <section id="preguntas" className="mx-auto w-full max-w-2xl scroll-mt-16 px-6 py-14">
            <div className="text-center">
              <p className="ap-eyebrow">Preguntas que nos hacen</p>
            </div>
            <div className="mt-6 divide-y divide-line border-y border-line">
              {faqs.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg">
                    {f.q}
                    <span className="text-muted transition-transform group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Reserva */}
          <section id="reservar" className="mx-auto w-full max-w-xl scroll-mt-8 px-6 py-14">
            <div className="text-center">
              <p className="ap-eyebrow">Tu lugar</p>
              <h2 className="ap-display mt-4 text-4xl sm:text-5xl">Reservá</h2>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted">
                Elegís cuántos son y pagás por Mercado Pago. Después elegís tu silla en la mesa y te llega la dirección exacta.
              </p>
            </div>
            <div className="card mt-8 p-6 sm:p-8">
              {free > 0 ? (
                <ReserveForm eventId={event.id} price={event.price} free={free} maxSeats={MAX_SEATS_PER_RESERVATION} />
              ) : (
                <div className="text-center">
                  <p className="font-display text-2xl">Se agotó</p>
                  <p className="mt-2 text-sm text-muted">Dejá tu mail: te avisamos si se libera un lugar y cuando abramos la próxima fecha.</p>
                  <div className="mt-5 text-left">
                    <SubscribeForm />
                  </div>
                </div>
              )}
            </div>
            <dl className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line text-sm sm:grid-cols-3">
              <Fact label="Dónde" value={`${ZONE}. El número te llega al confirmar.`} />
              <Fact label="Cuándo" value={`${formatWeekday(event.date)} ${formatDayNumber(event.date)} de ${formatMonth(event.date)}, ${formatTime(event.date)} hs.`} />
              <Fact label="Cuánto" value={`${formatPrice(event.price)} por persona, por Mercado Pago.`} />
            </dl>
          </section>

          {/* Avisos */}
          <section className="mx-auto w-full max-w-xl px-6 pb-16">
            <div className="card p-6">
              <p className="font-display text-xl">¿No llegás a esta fecha?</p>
              <p className="mt-1 text-sm text-muted">Dejá tu mail y te avisamos cuando abramos la próxima. Un mail por cena, nada más.</p>
              <SubscribeForm />
            </div>
          </section>
        </>
      )}

      <footer className="border-t border-line py-8 text-center text-xs text-muted">
        <p>{SITE_NAME} · Cena a puertas cerradas · La Plata</p>
        <Link href="/fechas" className="mt-2 inline-block hover:text-ink">
          Ver todas las fechas
        </Link>
      </footer>

      {/* Barra fija en el celular */}
      {event && free > 0 && (
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
