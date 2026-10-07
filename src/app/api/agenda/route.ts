import { NextResponse } from "next/server";
import { getBarra, getExcepcion } from "@/lib/barra";
import { SITE_NAME, ZONE, siteUrl } from "@/lib/config";
import { diasQueAbre, horaDeApertura, proximaApertura } from "@/lib/horario";

export const dynamic = "force-dynamic";

/** Como los quiere el calendario: 20261009T230000Z. */
function comoICS(d: Date): string {
  return d.toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}/u, "");
}

/**
 * Ninguna línea puede pasar de 75 caracteres: las que siguen van sangradas con un espacio.
 * Sin esto, Outlook y el calendario del iPhone pueden rechazar el archivo entero.
 */
function plegar(linea: string): string {
  if (linea.length <= 75) return linea;
  const partes = [linea.slice(0, 75)];
  for (let i = 75; i < linea.length; i += 74) partes.push(` ${linea.slice(i, i + 74)}`);
  return partes.join("\r\n");
}

/** Los saltos de línea y las comas van escapados, o el archivo no abre. */
function texto(s: string): string {
  return s.replace(/\\/gu, "\\\\").replace(/\n/gu, "\\n").replace(/([,;])/gu, "\\$1");
}

/**
 * El próximo día que abre, para el calendario del teléfono.
 *
 * Es lo único que alguien puede hacer con esta página sin dar nada a cambio ni salir de ella: la
 * mayoría llega desde una historia de Instagram un martes, le gusta, y el lunes ya se olvidó. Un
 * toque acá y el teléfono se lo recuerda solo.
 */
export async function GET() {
  const barra = await getBarra();
  const excepcion = await getExcepcion();
  const dias = diasQueAbre(barra.dias);
  const hora = horaDeApertura(barra.horario) ?? 20;
  const cuando = proximaApertura(dias, hora, new Date(), excepcion);
  if (!cuando) return NextResponse.json({ error: "Todavía no hay día" }, { status: 404 });

  const donde = barra.direccion || ZONE;
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE_NAME}//Agenda//ES`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${comoICS(cuando.inicio)}-casa@catdog`,
    `DTSTAMP:${comoICS(new Date())}`,
    `DTSTART:${comoICS(cuando.inicio)}`,
    `DTEND:${comoICS(cuando.fin)}`,
    `SUMMARY:${texto(`${SITE_NAME} · La casa está abierta`)}`,
    `LOCATION:${texto(donde)}`,
    `DESCRIPTION:${texto(`Sin reserva: caés, te sentás y listo. ${barra.horario}, y sigue hasta que se va el último.\n\n${siteUrl()}/?de=agenda`)}`,
    // Con su `?de=`: el que vuelve desde el recordatorio del teléfono se cuenta aparte.
    `URL:${siteUrl()}/?de=agenda`,
    // Un aviso dos horas antes, que es cuando todavía se puede decidir salir.
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${texto(`${SITE_NAME} abre hoy`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new NextResponse(`${lineas.map(plegar).join("\r\n")}\r\n`, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'attachment; filename="catdog.ics"',
      "cache-control": "no-store",
    },
  });
}
