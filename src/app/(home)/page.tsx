import type { Metadata } from "next";
import Link from "next/link";
import { MAX_SEATS_PER_RESERVATION, SITE_NAME, formatPrice } from "@/lib/config";
import { formatDayNumber, formatMonth, formatTime, formatWeekday, weekOf } from "@/lib/dates";
import { getUpcomingEvents } from "@/lib/reservations";
import { parseBar, parseMenu } from "@/lib/menu";
import { getAbout, getInstagram, getPhotos } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { BarList } from "@/components/BarList";
import { ReserveForm, type ReservableEvent } from "@/components/ReserveForm";
import { SubscribeForm } from "@/components/SubscribeForm";
import { TrackVisit } from "@/components/TrackVisit";
import { PhotoStrip } from "@/components/PhotoStrip";
import { StickyCta } from "@/components/StickyCta";
import { Reveal } from "@/components/Reveal";
import { AnchorNav } from "@/components/AnchorNav";
import { Countdown } from "@/components/Countdown";
import { MapFacade } from "@/components/MapFacade";
import { ShareButton } from "@/components/ShareButton";
import { siteUrl } from "@/lib/config";
import { foodEventJsonLd } from "@/lib/structured-data";
import { getApprovedReviews, getAverageRating } from "@/lib/reviews";

/**
 * El home se genera y se guarda un minuto (ISR): responde al instante y los metadatos
 * (título, descripción, vista previa) van en el <head>, donde los leen WhatsApp y Google.
 * "Pocos lugares" / "agotado" pueden atrasarse hasta un minuto: para el público alcanza.
 */
export const revalidate = 60;

/** Zona pública (sin el número): lo que se dice antes de pagar. */
const ZONE = "Calle 66, entre 2 y 3 · La Plata";
/** Centro del mapa: la cuadra, sin marcador (el número exacto no se muestra). */
const MAP_CENTER = "-34.9218,-57.9306";

export async function generateMetadata(): Promise<Metadata> {
  const [event] = await getUpcomingEvents(1);
  const title = event
    ? `${formatWeekday(event.date)} ${formatDayNumber(event.date)} de ${formatMonth(event.date)} · Cena a puertas cerradas en La Plata`
    : `Cena a puertas cerradas en La Plata`;
  const description = event
    ? `Una mesa larga en una casa de La Plata. Cinco pasos, cada plato con su trago. ${formatPrice(event.price)} por persona, pocos lugares.`
    : "Una mesa larga en una casa de La Plata. Cinco pasos, cada plato con su trago.";
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image", title, description } };
}

export default async function HomePage() {
  const [upcoming, about, photos, eventCount, reviews, rating, instagram] = await Promise.all([
    getUpcomingEvents(),
    getAbout(),
    getPhotos(),
    prisma.event.count(),
    getApprovedReviews(),
    getAverageRating(),
    getInstagram(),
  ]);
  // El afiche muestra la fecha más cercana; si se llenó, la reserva pasa a la siguiente con lugar.
  const event = upcoming[0] ?? null;
  const free = event?.free ?? 0;
  const nextOpen = upcoming.find((e) => e.free > 0) ?? null;
  const soldOut = Boolean(event) && free <= 0;
  const steps = parseMenu(event?.menu);
  const bar = parseBar(event?.bar);
  const heroTitle = eventCount <= 1 ? "Apertura" : "Próxima cena";
  const dateShort = (d: Date) => `${formatWeekday(d)} ${formatDayNumber(d)}`;
  const dateLong = (d: Date) => `${formatWeekday(d)} ${formatDayNumber(d)} de ${formatMonth(d)}, ${formatTime(d)} hs`;
  const reservable: ReservableEvent[] = upcoming.map((e) => ({ id: e.id, short: dateShort(e.date), long: dateLong(e.date), price: e.price, free: e.free }));

  const scarcity = soldOut
    ? { label: nextOpen ? `agotado · hay lugar el ${dateShort(nextOpen.date)}` : "agotado", tone: "text-danger" }
    : free <= 3
      ? { label: "últimos lugares", tone: "text-danger" }
      : { label: "pocos lugares", tone: "text-muted" };
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
      q: "¿Cómo llego?",
      a: "Está en el casco urbano de La Plata, a pocas cuadras del centro: se llega en auto, en micro o caminando. Con la confirmación te mandamos el número exacto y alguna referencia para encontrar la puerta.",
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
      q: "¿Y si la fecha ya se llenó?",
      a: "Es una sola mesa y se llena rápido. Cuando una fecha se agota, abrimos la reserva para el viernes siguiente: la elegís ahí mismo en el formulario.",
    },
    {
      q: "¿Y si no puedo ir?",
      a: "Avisanos con tiempo por el WhatsApp que te llega con la confirmación. Podés pasarle tu lugar a otra persona (nos decís el nombre y listo) o, si hay lugar, cambiar a otra fecha.",
    },
  ];

  const aboutParagraphs = about.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="ap flex flex-1 flex-col pb-24 sm:pb-0">
      <TrackVisit path="/" />
      <Reveal />
      {event && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(foodEventJsonLd(event, photos.map((p) => p.url))) }}
        />
      )}

      <a href="#reservar" className="skip-link">
        Ir a reservar
      </a>

      {/* Nav de anclas (escritorio) */}
      <AnchorNav
        brand={SITE_NAME}
        items={[
          { href: "#carta", label: "La carta" },
          { href: "#nosotros", label: "Quiénes somos" },
          ...(reviews.length > 0 ? [{ href: "#opiniones", label: "Opiniones" }] : []),
          { href: "#donde", label: "Dónde" },
          { href: "#preguntas", label: "Preguntas" },
        ]}
      />

      {/* Afiche */}
      <section id="inicio" className="relative flex min-h-[92vh] items-center overflow-hidden px-6 py-20 sm:min-h-[88vh]">
        <div className="ap-frame" aria-hidden="true" />
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
              {soldOut ? (
                <p className="mt-4">
                  <span className="ap-soldout">Agotado</span>
                </p>
              ) : (
                <p className="mt-3 text-sm tracking-[0.2em] uppercase text-muted">
                  {formatTime(event.date)} hs
                  <Countdown dateIso={event.date.toISOString()} initial={countdown} />
                </p>
              )}
              <hr className="ap-rule mx-auto mt-8 w-56" />
              <p className="mt-8 font-display text-2xl sm:text-3xl">{event.title}</p>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
                Una casa, una mesa larga y {steps.length > 0 ? `${spellOut(steps.length).toLowerCase()} pasos` : "una cena"}, cada plato con su
                trago pensado al lado. Una noche, no un restaurante.
              </p>
              <div className="mt-10 flex flex-col items-center gap-3">
                {!soldOut ? (
                  <>
                    <a className="btn btn-primary px-8" href="#reservar">
                      Reservar mi lugar
                    </a>
                    <p className="text-sm text-muted">
                      {formatPrice(event.price)} por persona · <span className={scarcity.tone}>{scarcity.label}</span>
                    </p>
                  </>
                ) : nextOpen ? (
                  <>
                    <p className="max-w-sm text-sm leading-relaxed text-muted">
                      Esta fecha ya se llenó. La próxima es el <span className="text-ink">{dateLong(nextOpen.date)}</span>.
                    </p>
                    <a className="btn btn-primary px-8" href="#reservar">
                      Reservar para el {dateShort(nextOpen.date)}
                    </a>
                    <p className="text-sm text-muted">{formatPrice(nextOpen.price)} por persona</p>
                  </>
                ) : (
                  <>
                    <p className="max-w-sm text-sm leading-relaxed text-muted">Esta fecha ya se llenó. Dejá tu mail y te avisamos cuando abramos la próxima.</p>
                    <a className="btn btn-ghost px-8" href="#avisos">
                      Avisame de la próxima
                    </a>
                  </>
                )}
              </div>
              <a href="#carta" className="mt-12 inline-flex flex-col items-center gap-1 text-xs tracking-[0.2em] uppercase text-muted hover:text-ink">
                La carta de la noche
                <span className="ap-cue" aria-hidden="true">
                  ↓
                </span>
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
            <section id="carta" className="reveal mx-auto w-full max-w-xl scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24">
              <div className="menu-card">
                <div className="text-center">
                  <p className="ap-eyebrow">La carta de esta noche</p>
                  <h2 className="ap-display mt-3 text-3xl sm:text-4xl">{event.title}</h2>
                  <p className="ap-ornament mt-4">✦</p>
                  <p className="mt-4 text-sm text-muted">Cada paso sale de la cocina con su trago pensado al lado. Hay versión sin alcohol de todos.</p>
                </div>
                <ol className="mt-8">
                  {steps.map((s, i) => (
                    <li key={i} className="ap-step reveal" style={{ transitionDelay: `${i * 90}ms` }}>
                      <span className="n">{String(i + 1).padStart(2, "0")}</span>
                      <span className="dish">{s.dish}</span>
                      {s.drink && <span className="drink">{s.drink}</span>}
                    </li>
                  ))}
                </ol>
                {event.description && (
                  <p className="mt-8 text-center text-sm leading-relaxed whitespace-pre-line text-muted">{event.description}</p>
                )}
                {bar.length > 0 && (
                  <div className="mt-10 border-t border-accent/15 pt-8">
                    <BarList items={bar} price={event.barPrice} />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Fotos */}
          {photos.length > 0 && (
            <section id="fotos" className="reveal scroll-mt-16 py-10">
              <div className="mx-auto max-w-2xl px-6 text-center">
                <p className="ap-ornament mb-3">✦</p>
                <p className="ap-eyebrow">La casa</p>
              </div>
              <div className="mt-6">
                <PhotoStrip photos={photos} />
              </div>
            </section>
          )}

          {/* Quiénes somos */}
          <section id="nosotros" className="reveal mx-auto w-full max-w-2xl scroll-mt-16 px-6 py-16 sm:py-24">
            <div className="text-center">
              <p className="ap-ornament mb-3">✦</p>
                <p className="ap-eyebrow">Quiénes somos</p>
              <h2 className="ap-display mt-3 text-3xl sm:text-4xl">La casa de la calle 66</h2>
            </div>
            <div className="mx-auto mt-8 max-w-prose space-y-4 text-center leading-relaxed text-ink/90">
              {aboutParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {instagram && (
              <p className="mt-6 text-center">
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
                >
                  <InstagramIcon /> @{instagram}
                </a>
              </p>
            )}
          </section>

          {/* Lo que dicen */}
          {reviews.length > 0 && (
            <section id="opiniones" className="reveal mx-auto w-full max-w-2xl scroll-mt-16 px-6 py-16 sm:py-24">
              <div className="text-center">
                <p className="ap-ornament mb-3">✦</p>
                <p className="ap-eyebrow">Lo que dicen los que vinieron</p>
                {rating && rating.count >= 3 && (
                  <p className="mt-3 text-sm text-muted">
                    <span className="text-accent">{"★".repeat(Math.round(rating.avg))}</span> {rating.avg} de 5 · {rating.count} opiniones
                  </p>
                )}
              </div>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {reviews.map((r) => (
                  <li key={r.id} className="card p-5">
                    <p className="text-sm text-accent" aria-label={`${r.rating} de 5`}>
                      {"★".repeat(r.rating)}
                      <span className="text-line">{"★".repeat(5 - r.rating)}</span>
                    </p>
                    <p className="mt-3 leading-relaxed">“{r.text}”</p>
                    <p className="mt-3 text-xs text-muted">
                      {r.name} · {r.eventTitle}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Dónde */}
          <section id="donde" className="reveal mx-auto w-full max-w-2xl scroll-mt-16 px-6 py-16 sm:py-24">
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
              <MapFacade center={MAP_CENTER} title="Mapa de la zona" />
            </div>
          </section>

          {/* Preguntas */}
          <section id="preguntas" className="reveal mx-auto w-full max-w-2xl scroll-mt-16 px-6 py-16 sm:py-24">
            <div className="text-center">
              <p className="ap-ornament mb-3">✦</p>
                <p className="ap-eyebrow">Preguntas que nos hacen</p>
            </div>
            <div className="mt-6 divide-y divide-line border-y border-line">
              {faqs.map((f) => (
                <details key={f.q} className="faq group py-4">
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
          <section id="reservar" className="mx-auto w-full max-w-xl scroll-mt-8 px-6 py-16 sm:py-24">
            <div className="text-center">
              <p className="ap-ornament mb-3">✦</p>
                <p className="ap-eyebrow">Tu lugar</p>
              <h2 className="ap-display mt-4 text-4xl sm:text-5xl">Reservá</h2>
            </div>
            <ol className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2 text-center text-xs text-muted">
              <Step n="1" text="Elegís cuántos son" />
              <Step n="2" text="Pagás por Mercado Pago" />
              <Step n="3" text="Elegís tu silla y te llega la dirección" />
            </ol>
            <div className="card card-gold mt-8 p-6 sm:p-8">
              {nextOpen ? (
                <ReserveForm events={reservable} defaultEventId={nextOpen.id} maxSeats={MAX_SEATS_PER_RESERVATION} />
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
              <Fact
                label="Cuándo"
                value={
                  upcoming.length > 1
                    ? `Los viernes, ${formatTime(event.date)} hs. Próximas: ${upcoming.map((e) => dateShort(e.date)).join(", ")}.`
                    : `${dateLong(event.date)}.`
                }
              />
              <Fact label="Cuánto" value={`${formatPrice((nextOpen ?? event).price)} por persona, por Mercado Pago.`} />
            </dl>
          </section>

          {/* Avisos */}
          <section id="avisos" className="mx-auto w-full max-w-xl scroll-mt-16 px-6 pb-16">
            <div className="card p-6">
              <p className="font-display text-xl">¿No llegás a esta fecha?</p>
              <p className="mt-1 text-sm text-muted">Dejá tu mail y te avisamos cuando abramos la próxima. Un mail por cena, nada más.</p>
              <SubscribeForm />
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted">¿Conocés a alguien que tiene que venir?</p>
              <ShareButton
                className="btn btn-ghost btn-sm mt-3"
                text={`Mirá esto: cena a puertas cerradas en La Plata, ${dateLong(event.date)}. Una mesa larga, cinco pasos, cada plato con su trago. ${siteUrl()}`}
              />
            </div>
          </section>
        </>
      )}

      <footer className="border-t border-line py-10 text-center text-xs text-muted">
        <p className="ap-ornament mb-4">✦</p>
        <p className="font-display text-base text-ink">{SITE_NAME}</p>
        <p className="mt-1">Cena a puertas cerradas · {ZONE}</p>
        {instagram && (
          <a
            href={`https://instagram.com/${instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 hover:text-ink"
          >
            <InstagramIcon /> @{instagram}
          </a>
        )}
        <p className="mt-3">
          <Link href="/fechas" className="hover:text-ink">
            Ver todas las fechas
          </Link>
        </p>
        <p className="mt-4">Hecho en La Plata · {new Date().getFullYear()}</p>
        <p className="mt-2">
          <Link href="/condiciones" className="hover:text-ink">
            Condiciones y privacidad
          </Link>
        </p>
      </footer>

      {/* Barra fija en el celular */}
      {event && nextOpen && (
        <StickyCta
          price={formatPrice(nextOpen.price)}
          scarcity={scarcity}
          label={soldOut ? `Reservar el ${formatDayNumber(nextOpen.date)}` : "Reservar"}
        />
      )}
    </div>
  );
}

function spellOut(n: number): string {
  const words = ["cero", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const w = words[n] ?? String(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <li className="rounded-xl border border-line bg-surface/60 px-2 py-3">
      <span className="font-display text-lg text-accent">{n}</span>
      <span className="mt-1 block leading-snug">{text}</span>
    </li>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <dt className="ap-eyebrow">{label}</dt>
      <dd className="mt-2 leading-relaxed text-muted">{value}</dd>
    </div>
  );
}
