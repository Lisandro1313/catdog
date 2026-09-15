import { createHmac } from "node:crypto";
import { CONTACT_PHONES, SITE_NAME, formatPhone, formatPrice, siteUrl, whatsappUrl } from "./config";
import { formatLong, formatTime } from "./dates";
import { parseMenu } from "./menu";
import { isEmailConfigured, sendMail, sendMany } from "./mailer";

export { isEmailConfigured };

function secret(): string {
  return process.env.APP_SECRET ?? process.env.ADMIN_PASSWORD ?? "dev-secret";
}

export function unsubscribeToken(email: string): string {
  return createHmac("sha256", secret()).update(email.toLowerCase()).digest("hex").slice(0, 32);
}

function unsubscribeUrl(email: string): string {
  const params = new URLSearchParams({ e: email, t: unsubscribeToken(email) });
  return `${siteUrl()}/baja?${params.toString()}`;
}

function layout(title: string, body: string, footer = ""): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>${title}</title></head><body style="margin:0;background:#141210;font-family:Georgia,serif;color:#f3ede4">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <p style="letter-spacing:.2em;text-transform:uppercase;font-size:12px;color:#c9a96e;margin:0 0 8px">${SITE_NAME}</p>
    <h1 style="font-size:28px;font-weight:normal;margin:0 0 24px">${title}</h1>
    <div style="font-size:16px;line-height:1.6;color:#e6dfd3">${body}</div>
    <hr style="border:0;border-top:1px solid #2c2823;margin:32px 0">
    <p style="font-size:12px;color:#8a8279">${footer}</p>
  </div></body></html>`;
}

type EventLike = { title: string; date: Date; price: number; description?: string | null; menu?: string | null; address?: string | null };

/** La carta en el mail: número, plato y, debajo, el cóctel en dorado. */
function menuHtml(menu: string | null | undefined): string {
  const steps = parseMenu(menu);
  if (steps.length === 0) return "";
  const rows = steps
    .map(
      (st, i) =>
        `<tr><td style="padding:6px 10px 6px 0;color:#c9a96e;vertical-align:top">${String(i + 1).padStart(2, "0")}</td><td style="padding:6px 0;vertical-align:top">${st.dish}${
          st.drink ? `<br><span style="color:#c9a96e;font-style:italic;font-size:14px">${st.drink}</span>` : ""
        }</td></tr>`,
    )
    .join("");
  return `<p style="margin:22px 0 4px;color:#9a9187;font-size:13px;letter-spacing:.08em;text-transform:uppercase">La noche, en pasos</p><table cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows}</table>`;
}
export type RenderedMail = { subject: string; html: string };

export type ConfirmationInput = {
  name: string;
  event: EventLike;
  quantity: number;
  seats: number[];
  amount: number;
  reservationId: string;
};

export function renderReservationConfirmed(input: ConfirmationInput): RenderedMail {
  const link = `${siteUrl()}/reserva/${input.reservationId}`;
  const lugares = input.quantity === 1 ? "1 lugar" : `${input.quantity} lugares`;
  const row = (k: string, v: string) =>
    `<tr><td style="padding:8px 12px 8px 0;color:#9a9187;font-size:13px;letter-spacing:.08em;text-transform:uppercase;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:8px 0;color:#f3ede4;vertical-align:top">${v}</td></tr>`;
  const seatsText =
    input.seats.length > 0
      ? `<strong>${input.seats.join(", ")}</strong>`
      : `Todavía no elegiste. <a href="${link}" style="color:#c9a96e">Elegí tu silla acá</a>.`;
  const body = `
    <p>Hola ${input.name}. Te esperamos.</p>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;border-top:1px solid #2c2823;border-bottom:1px solid #2c2823;width:100%">
      ${row("Cena", `<strong>${input.event.title}</strong>`)}
      ${row("Cuándo", `${formatLong(input.event.date)}, ${formatTime(input.event.date)} hs`)}
      ${input.event.address ? row("Dónde", `<strong>${input.event.address}</strong>`) : ""}
      ${row("Reserva", `${lugares} a nombre de ${input.name} · ${formatPrice(input.amount)} pagados`)}
      ${row("Tu lugar", seatsText)}
    </table>
    <p style="color:#c9a96e"><strong>Llegá ${formatTime(input.event.date)} hs.</strong> Se recibe con un trago de pie, y a la mesa se pasa un rato después.</p>
    ${menuHtml(input.event.menu)}
    ${
      CONTACT_PHONES.length
        ? `<p>Cualquier cosa, escribinos por WhatsApp: ${CONTACT_PHONES.map(
            (p) => `<a href="${whatsappUrl(p)}" style="color:#c9a96e">${formatPhone(p)}</a>`,
          ).join(" · ")}</p>`
        : ""
    }
    <p>Guardá este mail: tiene la dirección y el link de tu reserva.</p>`;
  return {
    subject: `Reserva confirmada · ${input.event.title} · ${formatLong(input.event.date)}`,
    html: layout("¡Reserva confirmada!", body, `Tu reserva: <a href="${link}" style="color:#8a8279">${link}</a>`),
  };
}

export async function sendReservationConfirmed(input: ConfirmationInput & { to: string }) {
  if (!isEmailConfigured() || input.to.endsWith("@local")) return { skipped: true as const };
  const { error } = await sendMail({ to: input.to, ...renderReservationConfirmed(input) });
  if (error) console.error("[email] confirmación falló", error);
  return { skipped: false as const, error };
}

export async function sendAdminNewReservation(input: {
  name: string;
  email: string;
  phone: string | null;
  notes?: string | null;
  event: EventLike;
  quantity: number;
  amount: number;
  via: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!isEmailConfigured() || !adminEmail) return;
  const body = `
    <p><strong>${input.name}</strong> reservó ${input.quantity} lugar${input.quantity > 1 ? "es" : ""}.</p>
    <p>${input.event.title} · ${formatLong(input.event.date)}</p>
    <p>Email: ${input.email}<br>Tel: ${input.phone ?? "-"}<br>Pagó ${formatPrice(input.amount)} vía ${input.via}.</p>
    ${input.notes ? `<p><em>Nos avisa:</em> ${input.notes}</p>` : ""}
    <p><a href="${siteUrl()}/admin" style="color:#c9a96e">Ver panel</a></p>`;
  const { error } = await sendMail({
    to: adminEmail,
    subject: `Nueva reserva: ${input.name} (${input.quantity})`,
    html: layout("Nueva reserva", body),
  });
  if (error) console.error("[email] aviso admin falló", error);
}

export function renderNewEvent(event: EventLike, email: string): RenderedMail {
  return {
    subject: `Nueva fecha: ${event.title} · ${formatLong(event.date)}`,
    html: layout(
      "Hay nueva fecha",
      `<p><strong>${event.title}</strong><br>
       ${formatLong(event.date)} · ${formatTime(event.date)} hs<br>
       ${formatPrice(event.price)} por persona.</p>
       ${event.description ? `<p>${event.description.replace(/\n/g, "<br>")}</p>` : ""}
       <p>Son pocos lugares. Reservá el tuyo acá:<br>
       <a href="${siteUrl()}" style="color:#c9a96e">${siteUrl()}</a></p>`,
      `Recibís este mail porque te anotaste para enterarte de nuevas fechas. <a href="${unsubscribeUrl(email)}" style="color:#8a8279">Darse de baja</a>.`,
    ),
  };
}

export async function sendNewEventBlast(input: {
  emails: string[];
  event: EventLike;
}): Promise<{ sent: number; failed: number }> {
  if (!isEmailConfigured() || input.emails.length === 0) return { sent: 0, failed: 0 };
  return sendMany(input.emails.map((email) => ({ to: email, ...renderNewEvent(input.event, email) })));
}

/** Al día siguiente de la cena: un mail corto pidiendo la opinión, con link personal. */
export function renderReviewRequest(event: EventLike, p: { id: string; name: string }): RenderedMail {
  return {
    subject: `¿Cómo la pasaste? · ${event.title}`,
    html: layout(
      "Gracias por venir",
      `<p>Hola ${p.name.split(" ")[0]}. Gracias por venir el ${formatLong(event.date).toLowerCase()}.</p>
       <p>¿Nos contás cómo la pasaste? Son dos minutos y nos sirve mucho para las próximas:</p>
       <p><a href="${siteUrl()}/opinar/${p.id}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#c9a96e;color:#141210;text-decoration:none;font-weight:bold">Dejar mi opinión</a></p>
       <p>Y si conocés a alguien que le gustaría venir, la próxima fecha está en <a href="${siteUrl()}" style="color:#c9a96e">${siteUrl().replace(/^https?:\/\//, "")}</a>.</p>`,
      "Recibís este mail porque viniste a una de nuestras cenas.",
    ),
  };
}

export async function sendReviewRequests(input: {
  event: EventLike;
  people: { id: string; name: string; email: string }[];
}): Promise<{ sent: number; failed: number }> {
  const people = input.people.filter((p) => !p.email.endsWith("@local"));
  if (!isEmailConfigured() || people.length === 0) return { sent: 0, failed: 0 };
  return sendMany(people.map((p) => ({ to: p.email, ...renderReviewRequest(input.event, p) })));
}

/** El día anterior: recordatorio con dirección, hora y dos botones (confirmo / no puedo). */
export type ReminderInput = { name: string; event: EventLike; quantity: number; seats: number[]; reservationId: string };

export function renderReminder(input: ReminderInput): RenderedMail {
  const link = `${siteUrl()}/reserva/${input.reservationId}`;
  const first = input.name.split(" ")[0];
  const noPuedo = CONTACT_PHONES[0]
    ? whatsappUrl(CONTACT_PHONES[0], `Hola! Soy ${input.name}. No voy a poder ir a la cena del ${formatLong(input.event.date)}.`)
    : link;
  const btn = (href: string, label: string, primary = true) =>
    `<a href="${href}" style="display:inline-block;margin:6px 6px 6px 0;padding:12px 22px;border-radius:999px;${
      primary ? "background:#c9a96e;color:#141210;" : "border:1px solid #6f675f;color:#f3ede4;"
    }text-decoration:none;font-weight:bold">${label}</a>`;
  const body = `
    <p>Hola ${first}. Mañana es la cena: <strong>${formatLong(input.event.date)}, ${formatTime(input.event.date)} hs</strong>.</p>
    ${input.event.address ? `<p style="font-size:18px"><strong>${input.event.address}</strong><br><span style="color:#9a9187;font-size:14px">Casa sin cartel: portón, pasillo y puerta. Se recibe con un trago de pie.</span></p>` : ""}
    <p>${input.quantity === 1 ? "Tu lugar" : `Tus ${input.quantity} lugares`}: ${
      input.seats.length ? `silla${input.seats.length > 1 ? "s" : ""} <strong>${input.seats.join(", ")}</strong>` : `<a href="${link}" style="color:#c9a96e">todavía no elegiste la silla, elegila acá</a>`
    }.</p>
    <p style="margin-top:24px">¿Nos confirmás con un toque? Cocinamos justo para los que vienen.</p>
    <p>${btn(`${link}?confirmo=1`, "Confirmo que voy")}${btn(noPuedo, "No voy a poder", false)}</p>
    <p style="color:#9a9187;font-size:14px">Si no podés venir, podés pasarle tu lugar a otra persona: avisanos el nombre por WhatsApp.</p>`;
  return {
    subject: `Mañana te esperamos · ${input.event.title} · ${formatTime(input.event.date)} hs`,
    html: layout("Es mañana", body, `Tu reserva: <a href="${link}" style="color:#8a8279">${link}</a>`),
  };
}

export async function sendReminder(input: ReminderInput & { to: string }) {
  if (!isEmailConfigured() || input.to.endsWith("@local")) return { skipped: true as const };
  const { error } = await sendMail({ to: input.to, ...renderReminder(input) });
  if (error) console.error("[email] recordatorio falló", error);
  return { skipped: false as const, error };
}
