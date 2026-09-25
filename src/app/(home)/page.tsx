import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { HOLD_MINUTES, MAX_SEATS_PER_RESERVATION, SITE_NAME, formatPrice } from "@/lib/config";
import { formatDayNumber, formatMonth, formatTime, formatWeekday, weekOf } from "@/lib/dates";
import { getUpcomingEvents } from "@/lib/reservations";
import { parseBar, parseMenu, splitDrink } from "@/lib/menu";
import { getAbout, getInstagram, getPhotos, getVideo } from "@/lib/photos";
import { VideoEmbed } from "@/components/VideoEmbed";
import { prisma } from "@/lib/prisma";
import { BarList } from "@/components/BarList";
import { ReserveForm, type ReservableEvent } from "@/components/ReserveForm";
import { SubscribeForm } from "@/components/SubscribeForm";
import { WaitlistForm } from "@/components/WaitlistForm";
import { TrackVisit } from "@/components/TrackVisit";
import { PhotoStrip } from "@/components/PhotoStrip";
import { StickyCta } from "@/components/StickyCta";
import { Reveal } from "@/components/Reveal";
import { AnchorNav } from "@/components/AnchorNav";
import { Countdown } from "@/components/Countdown";
import { MapFacade } from "@/components/MapFacade";
import { ShareButton } from "@/components/ShareButton";
import { contactEmail, siteUrl } from "@/lib/config";
import { foodEventJsonLd } from "@/lib/structured-data";
import { getApprovedReviews, getAverageRating } from "@/lib/reviews";
import { getApprovedHuellas, getLastWinners } from "@/lib/vivo";
import { getPaymentConfig } from "@/lib/payment";

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
  const weekday = event ? formatWeekday(event.date) : "";
  const title = event
    ? `${SITE_NAME} · ${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${formatDayNumber(event.date)} de ${formatMonth(event.date)} · Cena a puertas cerradas en La Plata`
    : `${SITE_NAME} · Cena a puertas cerradas en La Plata`;
  const description = event
    ? `Una cena en una casa de La Plata. Varios pasos, cada plato con su cóctel de autor. ${formatPrice(event.price)} por persona, pocos lugares.`
    : "Una cena en una casa de La Plata. Varios pasos, cada plato con su cóctel de autor.";
  // La imagen se genera en /opengraph-image; el sufijo cambia con la fecha para que WhatsApp no muestre una vieja.
  const image = { url: `/opengraph-image?v=${event ? event.date.getTime() : 0}`, width: 1200, height: 630, alt: "Cena a puertas cerradas en La Plata" };
  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function HomePage() {
  const [upcoming, about, photos, eventCount, reviews, rating, instagram, payment, video, huellas, winners] = await Promise.all([
    getUpcomingEvents(),
    getAbout(),
    getPhotos(),
    prisma.event.count({ where: { published: true, unlisted: false } }),
    getApprovedReviews(),
    getAverageRating(),
    getInstagram(),
    getPaymentConfig(),
    getVideo(),
    getApprovedHuellas(9),
    getLastWinners(),
  ]);
  const byTransfer = payment.mode === "transferencia";
  // El afiche muestra la fecha más cercana; si se llenó, la reserva pasa a la siguiente con lugar.
  const event = upcoming[0] ?? null;
  const free = event?.free ?? 0;
  const nextOpen = upcoming.find((e) => e.free > 0) ?? null;
  const soldOut = Boolean(event) && free <= 0;
  const soldOutLabel = event?.closedAt ? "Reservas cerradas" : "Agotado";
  // Si la próxima cena todavía no tiene carta, se muestra la de la última cena como anticipo, aclarándolo.
  const ownSteps = parseMenu(event?.menu);
  const previous =
    event && ownSteps.length === 0
      ? await prisma.event.findFirst({
          where: { published: true, unlisted: false, date: { lt: event.date }, menu: { not: "" } },
          orderBy: { date: "desc" },
          select: { title: true, date: true, menu: true, bar: true, barPrice: true, description: true },
        })
      : null;
  const menuSource = ownSteps.length > 0 ? event : previous && parseMenu(previous.menu).length > 0 ? previous : null;
  const steps = parseMenu(menuSource?.menu);
  const bar = parseBar(menuSource?.bar);
  const menuIsPrevious = Boolean(previous) && menuSource === previous;
  // Lo que pasa por la cinta de arriba: el coctel de recepcion y despues cada paso con el suyo, entero.
  const bienvenida = event?.welcomeDrink ? splitDrink(event.welcomeDrink) : null;
  const cinta = [
    // De la frase de recepcion va solo lo primero: la cinta es para leer al pasar, no un parrafo.
    ...(bienvenida ? [{ plato: "Al llegar", nombre: bienvenida.name, nota: bienvenida.note?.split(/\.\s/)[0] ?? null }] : []),
    ...steps.map((s) => {
      const d = s.drink ? splitDrink(s.drink) : null;
      return { plato: s.dish, nombre: d?.name ?? null, nota: d?.note ?? null };
    }),
  ];
  // La cinta va siempre a la misma velocidad (unos 45 px por segundo), mida lo que mida la carta:
  // si no, una carta larga pasaria volando y una corta se arrastraria.
  const anchoCinta = cinta.reduce((n, c) => n + (c.plato.length + (c.nombre?.length ?? 0) + (c.nota?.length ?? 0)) * 8.2 + 90, 0);
  const cintaSegundos = Math.min(120, Math.max(28, Math.round(anchoCinta / 45)));
  const heroTitle = eventCount <= 1 ? "Apertura" : "Próxima cena";
  const dateShort = (d: Date) => `${formatWeekday(d)} ${formatDayNumber(d)}`;
  const dateLong = (d: Date) => `${formatWeekday(d)} ${formatDayNumber(d)} de ${formatMonth(d)}, ${formatTime(d)} hs`;
  const reservable: ReservableEvent[] = upcoming.map((e) => ({ id: e.id, short: dateShort(e.date), long: dateLong(e.date), price: e.price, free: e.free }));

  const scarcity = soldOut
    ? { label: nextOpen ? `${soldOutLabel.toLowerCase()} · hay lugar el ${dateShort(nextOpen.date)}` : soldOutLabel.toLowerCase(), tone: "text-danger" }
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
      a: "El cóctel sin alcohol de recepción, los pasos de la cena con el cóctel de autor que acompaña a cada uno, y agua en la mesa. Lo que quieras tomar además, de la barra, va aparte.",
    },
    {
      q: "¿Puedo ir solo o sola?",
      a: "Sí, y está bueno. La noche está pensada para compartir: mucha gente viene sola o de a dos y termina charlando con desconocidos.",
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
      a: byTransfer
        ? `Por transferencia. Reservás en la página, te mostramos el alias y nos mandás el comprobante por WhatsApp. Tu lugar queda guardado ${payment.holdHours} horas mientras tanto, y con el comprobante te llega la confirmación con la dirección.`
        : `Por Mercado Pago al reservar: tarjeta, débito o dinero en cuenta. Mientras pagás, tu cupo queda guardado ${HOLD_MINUTES} minutos.`,
    },
    {
      q: "¿Comés distinto? ¿Alergias?",
      a: "Contanos al reservar, hay un campo para eso. Lo tenemos en cuenta antes de cocinar.",
    },
    {
      q: "¿Y si la fecha ya se llenó?",
      a: "Son pocos lugares y se llenan rápido. Cuando una fecha se agota, podés anotarte en la lista de espera (si se libera un lugar te avisamos por mail) o reservar para la fecha siguiente, ahí mismo en el formulario.",
    },
    {
      q: "¿Y si no puedo ir?",
      a: "Podés pasarle tu lugar a otra persona vos mismo, desde el link de tu reserva: cambiás el nombre y le llega la confirmación. Si preferís cambiar de fecha, avisanos con tiempo por WhatsApp y lo vemos.",
    },
    ...(contactEmail()
      ? [
          {
            q: "¿Tenés otra duda?",
            a: `Escribinos a ${contactEmail()} y te respondemos nosotros. Después de reservar también tenés nuestro WhatsApp.`,
          },
        ]
      : []),
  ];

  const aboutParagraphs = about.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="ap flex flex-1 flex-col pb-24 sm:pb-0">
      <TrackVisit path="/" />
      <Reveal />
      {event && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(foodEventJsonLd(event, photos.map((p) => (p.url.startsWith("/") ? `${siteUrl()}${p.url}` : p.url)))).replace(/</g, "\\u003c") }}
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
          { href: "#sobremesa", label: "La sobremesa" },
          { href: "#donde", label: "Dónde" },
          { href: "#preguntas", label: "Preguntas" },
        ]}
      />

      {/* Afiche */}
      <section id="inicio" className="relative flex min-h-[92dvh] items-center overflow-hidden px-6 py-20 sm:min-h-[88dvh]">
        {photos[0] && (
          <div className="ap-photo" aria-hidden="true">
            <Image src={photos[0].url} alt="" fill sizes="100vw" priority className="object-cover" />
          </div>
        )}
        {/* Brasas: el rescoldo abajo y las chispas que suben. Va antes del grano para que la textura
            de afiche impreso quede por encima y no se note el degradado. */}
        <div className="ap-brasas" aria-hidden="true">
          {CHISPAS.map((c, i) => (
            <span
              key={i}
              className="ap-chispa"
              style={
                {
                  "--x": c.x,
                  "--tam": c.tam,
                  "--demora": c.demora,
                  "--dura": c.dura,
                  "--deriva": c.deriva,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div className="ap-grain" aria-hidden="true" />
        <div className="ap-frame" aria-hidden="true" />
        {cinta.length > 0 && (
          /* La carta pasando abajo del afiche: se ve de entrada y se mueve sola. La segunda vuelta es
             la misma lista repetida (oculta para el lector de pantalla) para que el loop no tenga costura. */
          <a className="ap-cinta" href="#carta" aria-label="La carta de la noche">
            <div className="ap-cinta-pista" style={{ animationDuration: `${cintaSegundos}s` }}>
              {[0, 1].map((vuelta) => (
                <div className="ap-cinta-grupo" key={vuelta} aria-hidden={vuelta === 1 ? true : undefined}>
                  {cinta.map((c, i) => (
                    <span key={i}>
                      <span className="plato">{c.plato}</span>
                      {c.nombre && <span className="trago">{c.nombre}</span>}
                      {c.nota && <span className="lleva">{c.nota}</span>}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </a>
        )}
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
                  <span className="ap-soldout">{soldOutLabel}</span>
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
                Una casa y {ownSteps.length > 0 ? `${spellOut(ownSteps.length).toLowerCase()} pasos` : "una cena"}, cada plato con un cóctel de autor
                pensado para ese plato. Una noche, no un restaurante.
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
              <a href="#carta" className="mt-10 inline-flex flex-col items-center gap-1 text-xs tracking-[0.2em] uppercase text-muted hover:text-ink">
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
                  <p className="ap-eyebrow">{menuIsPrevious ? "La carta de la última cena" : "La carta de esta noche"}</p>
                  <h2 className="ap-display mt-3 text-3xl sm:text-4xl">{menuSource?.title ?? event.title}</h2>
                  <p className="ap-ornament mt-4">✦</p>
                  {menuIsPrevious && menuSource && (
                    <p className="mt-4 text-sm text-accent">
                      Esto fue el {formatWeekday(menuSource.date)} {formatDayNumber(menuSource.date)}. La carta de la próxima la subimos en estos días; cambia cada
                      semana, pero la idea es esta.
                    </p>
                  )}
                  <p className="mt-4 text-sm text-muted">Cada paso sale de la cocina con un cóctel de autor pensado para ese plato. Si no tomás alcohol, avisanos al reservar y te armamos la versión sin.</p>
                </div>
                <ol className="mt-8">
                  {steps.map((s, i) => (
                    <li key={i} className="ap-step reveal" style={{ transitionDelay: `${i * 90}ms` }}>
                      <span className="n">{String(i + 1).padStart(2, "0")}</span>
                      <span className="dish">{s.dish}</span>
                      {s.drink && (
                        <span className="drink">
                          <span className="drink-name">{splitDrink(s.drink).name}</span>
                          {splitDrink(s.drink).note && <span className="drink-note">{splitDrink(s.drink).note}</span>}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
                {menuSource?.description && (
                  <p className="mt-8 text-center text-sm leading-relaxed whitespace-pre-line text-muted">{menuSource.description}</p>
                )}
                {bar.length > 0 && (
                  <div className="mt-10 border-t border-accent/15 pt-8">
                    <BarList items={bar} price={menuSource?.barPrice ?? event.barPrice} />
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
                <h2 className="ap-eyebrow">Un anticipo</h2>
              </div>
              <div className="mt-6">
                <PhotoStrip photos={photos} />
              </div>
              {video && (
                <div className="mx-auto mt-8 max-w-2xl px-6">
                  <VideoEmbed url={video} />
                </div>
              )}
            </section>
          )}

        </>
      )}

      {/* Lo que no depende de la fecha: prueba social, quiénes somos, dónde y preguntas se ven siempre. */}
      <>
          {/* El libro de visitas */}
          {(huellas.length > 0 || winners) && (
            <section id="huellas" className="reveal mx-auto w-full max-w-2xl scroll-mt-16 px-6 py-16 sm:py-24">
              <div className="text-center">
                <p className="ap-ornament mb-3">✦</p>
                <h2 className="ap-eyebrow">Los que pasaron por acá</h2>
                {winners && (
                  <p className="mt-3 text-sm text-muted">
                    Lo más votado en {winners.eventTitle}:{winners.plato && <> <span className="text-ink">{winners.plato}</span></>}
                    {winners.plato && winners.trago && " y"}
                    {winners.trago && <> <span className="text-ink">{winners.trago}</span></>}.
                  </p>
                )}
              </div>
              {huellas.length > 0 && (
                <ul className="mt-8 grid gap-4 sm:grid-cols-3">
                  {huellas.map((h) => (
                    <li key={h.id} className="card overflow-hidden">
                      {h.photo && (
                        <Image src={h.photo} alt={h.text ? "" : `Foto de ${h.name}`} width={480} height={480} sizes="(min-width: 640px) 220px, 90vw" className="aspect-square w-full object-cover" />
                      )}
                      <div className="p-4">
                        {h.text && <p className="font-display text-lg leading-snug">“{h.text}”</p>}
                        <p className={`text-xs text-muted ${h.text ? "mt-2" : ""}`}>
                          {h.name} · {h.eventTitle}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
                <h2 className="ap-eyebrow">Lo que dicen los que vinieron</h2>
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

          {/* La sobremesa */}
          <section id="sobremesa" className="reveal mx-auto w-full max-w-2xl scroll-mt-16 px-6 py-16 sm:py-24">
            <div className="text-center">
              <p className="ap-ornament mb-3">✦</p>
              <h2 className="ap-eyebrow">La sobremesa</h2>
              <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted">
                La charla no termina cuando se levantan los platos. Un lugar para seguir un tema de la mesa, pedir la receta de
                algo, recomendar un disco o tirar una idea para la próxima.
              </p>
              <p className="mt-6">
                <Link className="btn btn-ghost" href="/sobremesa">
                  Entrar a la sobremesa
                </Link>
              </p>
            </div>
          </section>

          {/* Dónde */}
          <section id="donde" className="reveal mx-auto w-full max-w-2xl scroll-mt-16 px-6 py-16 sm:py-24">
            <div className="grid gap-6 sm:grid-cols-[1fr_1fr] sm:items-center">
              <div>
                <p className="ap-eyebrow">Dónde</p>
                <p className="mt-3 font-display text-2xl sm:text-3xl">{ZONE}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Una casa sin cartel en el casco de La Plata. Se entra por un portón y un pasillo. El número exacto te llega con la
                  confirmación de la reserva.
                </p>
                <p className="mt-3 text-sm text-muted">
                  {event ? (
                    <>
                      Llegá <span className="text-ink">{formatTime(event.date)} hs</span>. Se recibe de pie con un cóctel sin alcohol de la casa.
                    </>
                  ) : (
                    <>Se recibe de pie con un cóctel sin alcohol de la casa.</>
                  )}
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

      </>

      {event && (
        <>
          {/* Reserva */}
          <section id="reservar" className="mx-auto w-full max-w-xl scroll-mt-8 px-6 py-16 sm:py-24">
            <div className="text-center">
              <p className="ap-ornament mb-3">✦</p>
                <p className="ap-eyebrow">Tu lugar</p>
              <h2 className="ap-display mt-4 text-4xl sm:text-5xl">Reservá</h2>
            </div>
            <ol className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2 text-center text-xs text-muted">
              <Step n="1" text="Elegís cuántos son" />
              <Step n="2" text={byTransfer ? "Transferís y nos mandás el comprobante" : "Pagás por Mercado Pago"} />
              <Step n="3" text={byTransfer ? "Te confirmamos, elegís tu silla y te llega la dirección" : "Elegís tu silla y te llega la dirección"} />
            </ol>
            <div className="card card-gold mt-8 p-6 sm:p-8">
              {nextOpen && (
                <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-line pb-5">
                  <p>
                    <span className="font-display text-3xl">{formatPrice(nextOpen.price)}</span>
                    <span className="text-sm text-muted"> por persona</span>
                  </p>
                  <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                    <li>✓ Cóctel de recepción</li>
                    <li>✓ {ownSteps.length > 0 ? `${ownSteps.length} pasos` : "La cena completa"}</li>
                    <li>✓ Un cóctel de autor por paso</li>
                    <li>✓ Agua en la mesa</li>
                  </ul>
                </div>
              )}
              {nextOpen ? (
                <ReserveForm events={reservable} defaultEventId={nextOpen.id} maxSeats={MAX_SEATS_PER_RESERVATION} byTransfer={byTransfer} holdHours={payment.holdHours} />
              ) : (
                <div className="text-center">
                  <p className="font-display text-2xl">Se agotó</p>
                  {event && !event.closedAt ? (
                    <>
                      <p className="mt-2 text-sm text-muted">A veces alguien no puede venir. Anotate y, si se libera un lugar, te avisamos por mail: el que llega primero, reserva.</p>
                      <div className="mt-2 text-left">
                        <WaitlistForm eventId={event.id} dateLabel={dateShort(event.date)} />
                      </div>
                      <p className="mt-8 text-sm text-muted">Y para enterarte de las próximas fechas:</p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-muted">Dejá tu mail: te avisamos cuando abramos la próxima fecha.</p>
                  )}
                  <div className="mt-2 text-left">
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
                    ? `${formatTime(event.date)} hs. Próximas: ${upcoming.map((e) => dateShort(e.date)).join(", ")}.`
                    : `${dateLong(event.date)}.`
                }
              />
              <Fact label="Cuánto" value={`${formatPrice((nextOpen ?? event).price)} por persona, ${byTransfer ? "por transferencia" : "por Mercado Pago"}.`} />
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
                text={`Mirá esto: cena a puertas cerradas en La Plata, ${dateLong(event.date)}. Cada plato con su cóctel de autor. ${siteUrl()}`}
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
        <p className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link href="/fechas" className="hover:text-ink">
            Ver todas las fechas
          </Link>
          <Link href="/hoy/jugar" className="hover:text-ink">
            Juegos de la mesa
          </Link>
          <Link href="/hoy/demo" className="hover:text-ink">
            Puertas adentro
          </Link>
        </p>
        {contactEmail() && (
          <p className="mt-3">
            <a href={`mailto:${contactEmail()}`} className="hover:text-ink">
              {contactEmail()}
            </a>
          </p>
        )}
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

/**
 * Las chispas del afiche. Están escritas a mano y no al azar: al azar algunas se amontonan y otras
 * dejan huecos, y en una pantalla quieta eso se nota. Cada una arranca en otro lado, tarda distinto
 * y deriva para su lado, así el ojo nunca encuentra el patrón.
 */
const CHISPAS = [
  { x: "4%", tam: "3px", demora: "0s", dura: "11s", deriva: "18px" },
  { x: "9%", tam: "5px", demora: "6.5s", dura: "9s", deriva: "26px" },
  { x: "14%", tam: "2px", demora: "3.2s", dura: "16s", deriva: "-14px" },
  { x: "19%", tam: "3px", demora: "9.8s", dura: "12s", deriva: "12px" },
  { x: "24%", tam: "5px", demora: "5.1s", dura: "9.5s", deriva: "24px" },
  { x: "29%", tam: "2px", demora: "12.4s", dura: "15s", deriva: "-22px" },
  { x: "33%", tam: "3px", demora: "1.3s", dura: "13s", deriva: "-20px" },
  { x: "38%", tam: "4px", demora: "7.9s", dura: "10s", deriva: "16px" },
  { x: "43%", tam: "2px", demora: "4.6s", dura: "17s", deriva: "-28px" },
  { x: "47%", tam: "3px", demora: "10.7s", dura: "11s", deriva: "14px" },
  { x: "52%", tam: "5px", demora: "2.4s", dura: "8.5s", deriva: "22px" },
  { x: "57%", tam: "2px", demora: "8.1s", dura: "14s", deriva: "-16px" },
  { x: "61%", tam: "3px", demora: "13.6s", dura: "12.5s", deriva: "20px" },
  { x: "66%", tam: "4px", demora: "0.9s", dura: "10.5s", deriva: "-24px" },
  { x: "70%", tam: "2px", demora: "6.2s", dura: "16.5s", deriva: "10px" },
  { x: "75%", tam: "5px", demora: "11.3s", dura: "9s", deriva: "28px" },
  { x: "79%", tam: "3px", demora: "3.7s", dura: "13.5s", deriva: "-18px" },
  { x: "84%", tam: "2px", demora: "14.9s", dura: "15.5s", deriva: "16px" },
  { x: "88%", tam: "4px", demora: "5.8s", dura: "10s", deriva: "-26px" },
  { x: "92%", tam: "3px", demora: "9.1s", dura: "12s", deriva: "24px" },
  { x: "96%", tam: "2px", demora: "2.8s", dura: "17.5s", deriva: "-12px" },
  /* Tres bien chiquitas y lentas: las que parecen estar más lejos, atrás del fuego. */
  { x: "21%", tam: "2px", demora: "15.7s", dura: "19s", deriva: "8px" },
  { x: "55%", tam: "2px", demora: "17.2s", dura: "20s", deriva: "-9px" },
  { x: "83%", tam: "2px", demora: "16.4s", dura: "18.5s", deriva: "11px" },
];
