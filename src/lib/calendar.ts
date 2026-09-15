import { SITE_NAME } from "./config";

/** Duración estimada de la noche, para el bloque en el calendario. */
const HOURS = 4;

type CalEvent = { title: string; date: Date; address?: string | null };

function stampUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function endOf(date: Date): Date {
  return new Date(date.getTime() + HOURS * 60 * 60 * 1000);
}

function description(reservationUrl: string): string {
  return `Cena a puertas cerradas · ${SITE_NAME}. Tu reserva: ${reservationUrl}`;
}

/** Link "Agregar a Google Calendar" (no necesita archivo). */
export function googleCalendarUrl(event: CalEvent, reservationUrl: string): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${SITE_NAME} · ${event.title}`,
    dates: `${stampUtc(event.date)}/${stampUtc(endOf(event.date))}`,
    details: description(reservationUrl),
    location: event.address ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Archivo .ics (Apple Calendar, Outlook y cualquier otro). Con `invite` (organizador y asistente) va como
 * invitación (METHOD:REQUEST): así Gmail muestra la tarjeta "Agregar al calendario" en vez de un adjunto.
 */
export function icsFor(event: CalEvent, reservationUrl: string, uid: string, invite?: { organizer: string; attendee: string }): string {
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE_NAME}//Reservas//ES`,
    "CALSCALE:GREGORIAN",
    invite ? "METHOD:REQUEST" : "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    invite ? `ORGANIZER;CN=${esc(SITE_NAME)}:mailto:${invite.organizer}` : "",
    invite ? `ATTENDEE;CN=Invitado;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:${invite.attendee}` : "",
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    `UID:${uid}@catdog`,
    `DTSTAMP:${stampUtc(new Date())}`,
    `DTSTART:${stampUtc(event.date)}`,
    `DTEND:${stampUtc(endOf(event.date))}`,
    `SUMMARY:${esc(`${SITE_NAME} · ${event.title}`)}`,
    `DESCRIPTION:${esc(description(reservationUrl))}`,
    event.address ? `LOCATION:${esc(event.address)}` : "",
    `URL:${reservationUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
