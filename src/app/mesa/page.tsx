import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/config";
import { formatDayNumber, formatMonth, formatWeekday } from "@/lib/dates";
import { parseBar } from "@/lib/menu";
import { readSalaKey } from "@/lib/device";
import { getTonightEvent } from "@/lib/hoy";
import { getMisCuentas, getReservasDeLaNoche, MESAS } from "@/lib/sala";
import { MesaClient } from "@/components/mesa/MesaClient";
import { TrackVisit } from "@/components/TrackVisit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Tu cuenta · ${SITE_NAME}`,
  description: "La cuenta de la noche.",
  robots: { index: false, follow: false },
};

/**
 * El QR de la casa apunta acá: uno solo para todas las mesas. Como la cuenta es de cada persona,
 * la mesa se elige al abrirla (solo hace falta para saber a dónde llevar el plato y el trago).
 */
export default async function MesaPage() {
  const event = await getTonightEvent();

  if (!event) {
    return (
      <div className="ap flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <TrackVisit path="/mesa" />
        <p className="ap-eyebrow">{SITE_NAME}</p>
        <h1 className="ap-display mt-4 text-4xl">Hoy no hay función</h1>
        <p className="mt-4 text-muted">Las cuentas se abren la noche de la cena.</p>
        <Link href="/" className="btn btn-ghost mt-8">
          Ir al inicio
        </Link>
      </div>
    );
  }

  const key = await readSalaKey();
  const [cuentas, reservas] = await Promise.all([key ? getMisCuentas(event.id, key) : Promise.resolve([]), getReservasDeLaNoche(event.id)]);

  return (
    <>
      <TrackVisit path="/mesa" />
      <MesaClient
        eventId={event.id}
        title={event.title}
        dateLabel={`${formatWeekday(event.date)} ${formatDayNumber(event.date)} de ${formatMonth(event.date)}`}
        table={null}
        mesas={MESAS}
        price={event.price}
        menu={event.menu}
        bar={parseBar(event.bar)}
        barPrice={event.barPrice}
        reservas={reservas}
        initial={cuentas}
      />
    </>
  );
}
