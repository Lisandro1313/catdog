import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, formatPrice } from "@/lib/config";
import { formatDayNumber, formatMonth, formatTime, formatWeekday } from "@/lib/dates";
import { parseBar, parseMenu } from "@/lib/menu";
import { getUpcomingEvents } from "@/lib/reservations";
import { isAdmin } from "@/lib/admin-auth";
import { buildActs, gameReady, getDemoEvent, getTonightEvent, isHoyOff, publicActs } from "@/lib/hoy";
import { HoyClient } from "@/components/hoy/HoyClient";
import { TrackVisit } from "@/components/TrackVisit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Puertas adentro · ${SITE_NAME}`,
  description: "Lo que la carta no dice.",
  robots: { index: false },
};

type Props = { params: Promise<{ mesa: string }>; searchParams: Promise<{ [k: string]: string | string[] | undefined }> };

/**
 * El QR de cada mesita apunta acá (/hoy/1, /hoy/2…). Muestra la cena de esta noche como un juego
 * guiado y opcional. /hoy/demo sirve para verlo cualquier día con la próxima cena (secretos de ejemplo).
 */
export default async function HoyPage({ params, searchParams }: Props) {
  const { mesa } = await params;
  const sp = await searchParams;
  const demo = mesa === "demo";
  const table = /^\d{1,2}$/.test(mesa) ? Number(mesa) : null;
  const off = await isHoyOff();

  const tonight = await getTonightEvent();
  let event = tonight;
  let exampleSecrets = false;
  if (demo || (!tonight && !off)) {
    const wanted = typeof sp.e === "string" ? sp.e : null;
    // El mismo criterio que guessAction: el admin ve los secretos reales; cualquier otro, ejemplos.
    const admin = await isAdmin();
    const candidate = await getDemoEvent(admin ? wanted : null);
    if (candidate) {
      // Fuera de la noche real, un invitado nunca ve secretos de una cena futura: se juega con ejemplos.
      event = admin ? candidate : { ...candidate, steps: [] };
      exampleSecrets = !admin;
    }
  }

  if (!event || parseMenu(event.menu).length === 0) {
    const [next] = await getUpcomingEvents(1);
    return (
      <div className="ap flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <TrackVisit path="/hoy" />
        <p className="ap-eyebrow">{SITE_NAME}</p>
        <h1 className="ap-display mt-4 text-4xl">Hoy no hay función</h1>
        {next ? (
          <>
            <p className="mt-4 text-muted">
              La próxima es el {formatWeekday(next.date)} {formatDayNumber(next.date)} de {formatMonth(next.date)}, {formatTime(next.date)} hs ·{" "}
              {formatPrice(next.price)} por persona.
            </p>
            <Link href="/" className="btn btn-primary mt-8">
              Reservar
            </Link>
            <Link href="/hoy/jugar" className="mt-4 text-xs text-muted hover:text-ink">
              Mientras tanto, los juegos
            </Link>
          </>
        ) : (
          <Link href="/" className="btn btn-ghost mt-8">
            Ir al inicio
          </Link>
        )}
      </div>
    );
  }

  const live = Boolean(tonight && tonight.id === event.id) && !demo;
  const acts = buildActs(event, demo || exampleSecrets || !live);
  const bar = parseBar(event.bar);

  if (off) {
    // Apagado desde Ajustes: solo la carta y la barra, sin juego.
    const steps = parseMenu(event.menu);
    return (
      <div className="ap mx-auto w-full max-w-md px-6 py-12">
        <TrackVisit path="/hoy" />
        <p className="ap-eyebrow text-center">{SITE_NAME} · esta noche</p>
        <h1 className="ap-display mt-3 text-center text-3xl">{event.title}</h1>
        <ol className="mt-8">
          {steps.map((s, i) => (
            <li key={i} className="ap-step">
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span className="dish">{s.dish}</span>
              {s.drink && <span className="drink">{s.drink}</span>}
            </li>
          ))}
        </ol>
        {bar.length > 0 && (
          <div className="mt-8 border-t border-line pt-6">
            <p className="ap-eyebrow">La barra {event.barPrice ? `· ${formatPrice(event.barPrice)}` : ""}</p>
            <ul className="mt-3 space-y-2">
              {bar.map((b) => (
                <li key={b.name}>
                  <p className="font-display">{b.name}</p>
                  {b.description && <p className="text-xs text-muted">{b.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <TrackVisit path="/hoy" />
      <HoyClient
        eventId={event.id}
        title={event.title}
        dateLabel={`${formatWeekday(event.date)} ${formatDayNumber(event.date)} de ${formatMonth(event.date)}`}
        acts={publicActs(acts)}
        ready={gameReady(acts)}
        bar={bar}
        barPrice={event.barPrice}
        table={table}
        demo={!live}
        exampleSecrets={exampleSecrets || (!live && event.steps.length === 0)}
      />
    </>
  );
}
