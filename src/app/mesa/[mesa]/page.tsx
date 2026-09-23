import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/config";
import { formatDayNumber, formatMonth, formatWeekday } from "@/lib/dates";
import { parseBar } from "@/lib/menu";
import { readSalaKey } from "@/lib/device";
import { getTonightEvent } from "@/lib/hoy";
import { getMiCuenta, getReservasDeLaNoche } from "@/lib/sala";
import { MesaClient } from "@/components/mesa/MesaClient";
import { TrackVisit } from "@/components/TrackVisit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Tu mesa · ${SITE_NAME}`,
  description: "La cuenta de la noche.",
  robots: { index: false, follow: false },
};

/**
 * El QR de cada mesa apunta acá (/mesa/1, /mesa/2…). Cada persona abre su cuenta, la casa le cobra la
 * cena y desde ahí pide los pasos a su ritmo y lo que tome. Solo funciona la noche de una cena.
 */
export default async function MesaPage({ params }: { params: Promise<{ mesa: string }> }) {
  const { mesa } = await params;
  const table = /^[1-9]\d?$/.test(mesa) ? Number(mesa) : null;
  const event = await getTonightEvent();

  if (!table || !event) {
    return (
      <div className="ap flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <TrackVisit path="/mesa" />
        <p className="ap-eyebrow">{SITE_NAME}</p>
        <h1 className="ap-display mt-4 text-4xl">{table ? "Hoy no hay función" : "Esa mesa no existe"}</h1>
        <p className="mt-4 text-muted">{table ? "Las cuentas se abren la noche de la cena." : "Escaneá el código de tu mesa."}</p>
        <Link href="/" className="btn btn-ghost mt-8">
          Ir al inicio
        </Link>
      </div>
    );
  }

  const key = await readSalaKey();
  const [cuenta, reservas] = await Promise.all([key ? getMiCuenta(event.id, key) : Promise.resolve(null), getReservasDeLaNoche(event.id)]);

  return (
    <>
      <TrackVisit path="/mesa" />
      <MesaClient
        eventId={event.id}
        title={event.title}
        dateLabel={`${formatWeekday(event.date)} ${formatDayNumber(event.date)} de ${formatMonth(event.date)}`}
        table={table}
        price={event.price}
        menu={event.menu}
        bar={parseBar(event.bar)}
        barPrice={event.barPrice}
        reservas={reservas}
        initial={cuenta}
      />
    </>
  );
}
