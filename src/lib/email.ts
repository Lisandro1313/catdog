import { createHmac } from "node:crypto";
import { CONTACT_PHONES, SITE_NAME, formatPhone, formatPrice, siteUrl, whatsappUrl } from "./config";
import { formatLong, formatTime } from "./dates";
import { parseMenu } from "./menu";
import { isEmailConfigured, sendMail, sendMany } from "./mailer";
import { icsFor } from "./calendar";

/** Texto que cargó el público (nombres, notas, opiniones): nunca va crudo al HTML del mail. */
function esc(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function withText(m: { subject: string; html: string }): RenderedMail {
  return { ...m, text: toText(m.html) };
}

/** Versión en texto plano del mismo mail (misma info que el HTML: eso ayuda a que no caiga en spam). */
export function toText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, label: string) => {
      const t = label.replace(/<[^>]+>/g, "").trim();
      return t && t !== href ? `${t} (${href})` : href;
    })
    .replace(/<\/(p|div|tr|h1|h2|h3|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/td>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export { isEmailConfigured };

function secret(): string {
  const s = process.env.APP_SECRET ?? process.env.ADMIN_PASSWORD;
  if (s) return s;
  // En produccion un secreto conocido dejaria falsificar los links de baja: mejor que falle y se note.
  if (process.env.NODE_ENV === "production") throw new Error("Falta APP_SECRET (o ADMIN_PASSWORD) para firmar los links.");
  return "dev-secret";
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
export type RenderedMail = { subject: string; html: string; text?: string; ics?: string };

export type ConfirmationInput = {
  name: string;
  event: EventLike;
  quantity: number;
  seats: number[];
  amount: number;
  reservationId: string;
  /** Si es un regalo: para quién (aparece en el mail de quien pagó). */
  giftName?: string | null;
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
    <p>Hola ${esc(input.name)}. Te esperamos.</p>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;border-top:1px solid #2c2823;border-bottom:1px solid #2c2823;width:100%">
      ${row("Cena", `<strong>${input.event.title}</strong>`)}
      ${row("Cuándo", `${formatLong(input.event.date)}, ${formatTime(input.event.date)} hs`)}
      ${input.event.address ? row("Dónde", `<strong>${input.event.address}</strong>`) : ""}
      ${row("Reserva", `${lugares} a nombre de ${input.giftName ? `${esc(input.giftName)} (regalo de ${esc(input.name)})` : esc(input.name)} · ${formatPrice(input.amount)} pagados`)}
      ${row("Tu lugar", seatsText)}
    </table>
    <p style="color:#c9a96e"><strong>Llegá ${formatTime(input.event.date)} hs.</strong> Se recibe de pie con un cóctel sin alcohol de la casa, y a la mesa se pasa un rato después.</p>
    ${menuHtml(input.event.menu)}
    ${
      CONTACT_PHONES.length
        ? `<p>Cualquier cosa, escribinos por WhatsApp: ${CONTACT_PHONES.map(
            (p) => `<a href="${whatsappUrl(p)}" style="color:#c9a96e">${formatPhone(p)}</a>`,
          ).join(" · ")}</p>`
        : ""
    }
    <p>Guardá este mail: tiene la dirección y el link de tu reserva.</p>`;
  const html = layout("¡Reserva confirmada!", body, `Tu reserva: <a href="${link}" style="color:#8a8279">${link}</a>`);
  return {
    subject: `Reserva confirmada · ${input.event.title} · ${formatLong(input.event.date)}`,
    html,
    text: toText(html),
    ics: icsFor(input.event, link, input.reservationId),
  };
}

export async function sendReservationConfirmed(input: ConfirmationInput & { to: string }) {
  if (!isEmailConfigured() || input.to.endsWith("@local")) return { skipped: true as const };
  const mail = renderReservationConfirmed(input);
  // Como invitación (con organizador y asistente) Gmail muestra la tarjeta del calendario.
  const organizer = process.env.GMAIL_USER;
  if (organizer) mail.ics = icsFor(input.event, `${siteUrl()}/reserva/${input.reservationId}`, input.reservationId, { organizer, attendee: input.to });
  const { error } = await sendMail({ to: input.to, ...mail });
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
  /** Si el mail de confirmación a la persona salió bien (para enterarse de un problema a tiempo). */
  customerMail?: "ok" | "fallo" | "omitido";
  /** Para un cambio de nombre: quién tenía la reserva antes. */
  transferredFrom?: string;
  /** Reservó y va a transferir: todavía no pagó. */
  pendingTransfer?: boolean;
  eventId?: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!isEmailConfigured() || !adminEmail) return;
  const transfer = Boolean(input.transferredFrom);
  const mailLine =
    input.customerMail === "fallo"
      ? `<p style="color:#d98c74"><strong>Ojo:</strong> el mail de confirmación a ${input.email} no salió. Avisale por WhatsApp o mandale el link de su reserva desde el panel.</p>`
      : input.customerMail === "ok"
        ? `<p style="color:#9a9187;font-size:14px">Le mandamos la confirmación con la dirección a ${input.email}.</p>`
        : "";
  const body = input.pendingTransfer
    ? `
    <p><strong>${esc(input.name)}</strong> reservó ${input.quantity} lugar${input.quantity > 1 ? "es" : ""} y va a pagar <strong>por transferencia</strong> (${formatPrice(input.amount)}).</p>
    <p>${input.event.title} · ${formatLong(input.event.date)}</p>
    <p>Email: ${input.email}<br>Tel: ${input.phone ?? "-"}</p>
    ${input.notes ? `<p><em>Nos avisa:</em> ${esc(input.notes)}</p>` : ""}
    <p>Cuando te llegue el comprobante, marcala como pagada en el panel: ahí le sale el mail con la dirección.</p>
    <p><a href="${siteUrl()}/admin${input.eventId ? `/eventos/${input.eventId}` : ""}" style="color:#c9a96e">Ver la cena en el panel</a></p>`
    : transfer
    ? `
    <p><strong>${esc(input.transferredFrom ?? "")}</strong> le pasó su reserva a <strong>${esc(input.name)}</strong> (${input.quantity} lugar${input.quantity > 1 ? "es" : ""}).</p>
    <p>${input.event.title} · ${formatLong(input.event.date)}</p>
    <p>Email: ${input.email}<br>Tel: ${input.phone ?? "-"}</p>
    ${input.notes ? `<p><em>Nos avisa:</em> ${esc(input.notes)}</p>` : ""}
    ${mailLine}
    <p><a href="${siteUrl()}/admin${input.eventId ? `/eventos/${input.eventId}` : ""}" style="color:#c9a96e">Ver la cena en el panel</a></p>`
    : `
    <p><strong>${esc(input.name)}</strong> reservó ${input.quantity} lugar${input.quantity > 1 ? "es" : ""}.</p>
    <p>${input.event.title} · ${formatLong(input.event.date)}</p>
    <p>Email: ${input.email}<br>Tel: ${input.phone ?? "-"}<br>Pagó ${formatPrice(input.amount)} vía ${input.via}.</p>
    ${input.notes ? `<p><em>Nos avisa:</em> ${esc(input.notes)}</p>` : ""}
    ${mailLine}
    <p><a href="${siteUrl()}/admin${input.eventId ? `/eventos/${input.eventId}` : ""}" style="color:#c9a96e">Ver la cena en el panel</a></p>`;
  const html = layout(input.pendingTransfer ? "Reserva a confirmar" : transfer ? "Cambio de nombre en una reserva" : "Nueva reserva", body);
  const { error } = await sendMail({
    to: adminEmail,
    subject: input.pendingTransfer
      ? `Reserva a confirmar (transferencia): ${input.name} (${input.quantity})`
      : transfer
        ? `Reserva pasada a ${input.name}`
        : `Nueva reserva: ${input.name} (${input.quantity})`,
    html,
    text: toText(html),
  });
  if (error) console.error("[email] aviso admin falló", error);
}

/** A la persona: su reserva fue cancelada desde el panel (devolución o cambio se conversa por WhatsApp). */
export async function sendReservationCancelled(input: { to: string; name: string; event: EventLike; quantity: number; amount: number }) {
  if (!isEmailConfigured() || input.to.endsWith("@local")) return;
  const contact = CONTACT_PHONES.length
    ? `Cualquier duda, escribinos por WhatsApp: ${CONTACT_PHONES.map((p) => `<a href="${whatsappUrl(p)}" style="color:#c9a96e">${formatPhone(p)}</a>`).join(" · ")}.`
    : "";
  const html = layout(
    "Reserva cancelada",
    `<p>Hola ${esc(input.name.split(" ")[0])}. Cancelamos tu reserva de ${input.quantity === 1 ? "1 lugar" : `${input.quantity} lugares`} para <strong>${input.event.title}</strong>, ${formatLong(input.event.date)}.</p>
     <p>Si fue algo que hablamos, la devolución de ${formatPrice(input.amount)} sigue el camino que acordamos por WhatsApp. Si esto te sorprende, escribinos y lo vemos ya.</p>
     <p>${contact}</p>
     <p>Las próximas fechas están siempre en <a href="${siteUrl()}" style="color:#c9a96e">${siteUrl().replace(/^https?:\/\//, "")}</a>. Ojalá te veamos en la próxima.</p>`,
  );
  const { error } = await sendMail({ to: input.to, subject: `Reserva cancelada · ${input.event.title} · ${formatLong(input.event.date)}`, html, text: toText(html) });
  if (error) console.error("[email] cancelación falló", error);
}

/** Aviso al admin: llegó una opinión (queda pendiente hasta publicarla desde el panel). */
export async function sendAdminNewReview(input: { name: string; rating: number; text: string; event: EventLike; eventId: string }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!isEmailConfigured() || !adminEmail) return;
  const html = layout(
    "Nueva opinión",
    `<p><strong>${esc(input.name)}</strong> dejó ${input.rating} de 5 sobre ${input.event.title} (${formatLong(input.event.date)}):</p>
     <p style="font-size:18px">“${esc(input.text)}”</p>
     <p>No se publica hasta que la aprueben: <a href="${siteUrl()}/admin/eventos/${input.eventId}" style="color:#c9a96e">ver en el panel</a>.</p>`,
  );
  const { error } = await sendMail({ to: adminEmail, subject: `Nueva opinión: ${input.name} (${"★".repeat(input.rating)})`, html, text: toText(html) });
  if (error) console.error("[email] aviso opinión falló", error);
}

export function renderNewEvent(event: EventLike, email: string): RenderedMail {
  return withText({
    subject: `Nueva fecha: ${event.title} · ${formatLong(event.date)}`,
    html: layout(
      "Hay nueva fecha",
      `<p><strong>${event.title}</strong><br>
       ${formatLong(event.date)} · ${formatTime(event.date)} hs<br>
       ${formatPrice(event.price)} por persona.</p>
       ${event.description ? `<p>${event.description.replace(/\n/g, "<br>")}</p>` : ""}
       ${menuHtml(event.menu)}
       <p style="margin-top:20px">Son pocos lugares. Reservá el tuyo acá:<br>
       <a href="${siteUrl()}" style="color:#c9a96e">${siteUrl()}</a></p>`,
      `Recibís este mail porque te anotaste para enterarte de nuevas fechas. <a href="${unsubscribeUrl(email)}" style="color:#8a8279">Darse de baja</a>.`,
    ),
  });
}

export async function sendNewEventBlast(input: {
  emails: string[];
  event: EventLike;
}): Promise<{ sent: number; failed: number }> {
  if (!isEmailConfigured() || input.emails.length === 0) return { sent: 0, failed: 0 };
  return sendMany(input.emails.map((email) => ({ to: email, ...renderNewEvent(input.event, email) })));
}

/** Al día siguiente de la cena: un mail corto pidiendo la opinión, con link personal. */
export function renderReviewRequest(event: EventLike, p: { id: string; name: string }, next?: { id: string; title: string; date: Date } | null): RenderedMail {
  const nextLine = next
    ? `<p>La próxima es el <strong>${formatLong(next.date)}</strong> (${next.title}). Si querés repetir o traer a alguien: <a href="${siteUrl()}/?fecha=${next.id}#reservar" style="color:#c9a96e">reservá acá</a>.</p>`
    : `<p>Y si conocés a alguien que le gustaría venir, la próxima fecha está en <a href="${siteUrl()}" style="color:#c9a96e">${siteUrl().replace(/^https?:\/\//, "")}</a>.</p>`;
  return withText({
    subject: `¿Cómo la pasaste? · ${event.title}`,
    html: layout(
      "Gracias por venir",
      `<p>Hola ${esc(p.name.split(" ")[0])}. Gracias por venir el ${formatLong(event.date).toLowerCase()}.</p>
       <p>¿Nos contás cómo la pasaste? Son dos minutos y nos sirve mucho para las próximas:</p>
       <p><a href="${siteUrl()}/opinar/${p.id}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#c9a96e;color:#141210;text-decoration:none;font-weight:bold">Dejar mi opinión</a></p>
       ${nextLine}`,
      "Recibís este mail porque viniste a una de nuestras cenas.",
    ),
  });
}

export async function sendReviewRequests(input: {
  event: EventLike;
  people: { id: string; name: string; email: string }[];
  next?: { id: string; title: string; date: Date } | null;
}): Promise<{ sent: number; failed: number }> {
  const people = input.people.filter((p) => !p.email.endsWith("@local"));
  if (!isEmailConfigured() || people.length === 0) return { sent: 0, failed: 0 };
  return sendMany(people.map((p) => ({ to: p.email, ...renderReviewRequest(input.event, p, input.next) })));
}

/** Al reservar por transferencia: los datos para pagar, hasta cuándo se guarda el lugar y el link de la reserva. */
export type HoldInput = {
  name: string;
  event: EventLike;
  quantity: number;
  amount: number;
  reservationId: string;
  expiresAt: Date;
  payment: { alias: string; holder: string; bank: string };
};

export function renderHoldPending(input: HoldInput): RenderedMail {
  const link = `${siteUrl()}/reserva/${input.reservationId}`;
  const lugares = input.quantity === 1 ? "1 lugar" : `${input.quantity} lugares`;
  const row = (k: string, v: string) =>
    `<tr><td style="padding:8px 12px 8px 0;color:#9a9187;font-size:13px;letter-spacing:.08em;text-transform:uppercase;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:8px 0;color:#f3ede4;vertical-align:top">${v}</td></tr>`;
  const msg = `Hola! Soy ${input.name}. Reservé ${lugares} para ${input.event.title} (${formatLong(input.event.date)}) y les mando el comprobante de la transferencia de ${formatPrice(input.amount)}. Mi reserva: ${link}`;
  const wa = CONTACT_PHONES[0] ? whatsappUrl(CONTACT_PHONES[0], msg) : null;
  const body = `
    <p>Hola ${esc(input.name)}. Te guardamos ${lugares} para <strong>${input.event.title}</strong>, ${formatLong(input.event.date)}, ${formatTime(input.event.date)} hs.</p>
    <p>Para confirmarlo, transferí <strong style="font-size:20px">${formatPrice(input.amount)}</strong> antes del <strong>${formatLong(input.expiresAt).toLowerCase()} a las ${formatTime(input.expiresAt)} hs</strong>; después el lugar vuelve a liberarse.</p>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;border-top:1px solid #2c2823;border-bottom:1px solid #2c2823;width:100%">
      ${input.payment.alias ? row("Alias / CBU", `<strong style="font-family:monospace;font-size:18px">${input.payment.alias}</strong>`) : ""}
      ${input.payment.holder ? row("Titular", input.payment.holder) : ""}
      ${input.payment.bank ? row("Banco", input.payment.bank) : ""}
      ${row("Monto", `<strong>${formatPrice(input.amount)}</strong>`)}
    </table>
    <p>Después mandanos el comprobante por WhatsApp y lo confirmamos en el día: te llega otro mail con la dirección exacta y elegís tu silla.</p>
    ${wa ? `<p><a href="${wa}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#c9a96e;color:#141210;text-decoration:none;font-weight:bold">Mandar el comprobante</a></p>` : ""}
    <p style="color:#9a9187;font-size:14px">Si ya transferiste, no hace falta hacer nada más.</p>`;
  const html = layout("Tu lugar está guardado", body, `Tu reserva: <a href="${link}" style="color:#8a8279">${link}</a>`);
  return { subject: `Tu lugar está guardado · ${input.event.title} · ${formatLong(input.event.date)}`, html, text: toText(html) };
}

export async function sendHoldPending(input: HoldInput & { to: string }) {
  if (!isEmailConfigured() || input.to.endsWith("@local")) return { skipped: true as const };
  const { error } = await sendMail({ to: input.to, ...renderHoldPending(input) });
  if (error) console.error("[email] lugar guardado falló", error);
  return { skipped: false as const, error };
}

/** El día anterior: recordatorio con dirección, hora y dos botones (confirmo / no puedo). */
export type ReminderInput = { name: string; event: EventLike; quantity: number; seats: number[]; reservationId: string };

export function renderReminder(input: ReminderInput): RenderedMail {
  const link = `${siteUrl()}/reserva/${input.reservationId}`;
  const first = input.name.split(" ")[0];
  const noPuedo = `${link}?novoy=1`;
  const btn = (href: string, label: string, primary = true) =>
    `<a href="${href}" style="display:inline-block;margin:6px 6px 6px 0;padding:12px 22px;border-radius:999px;${
      primary ? "background:#c9a96e;color:#141210;" : "border:1px solid #6f675f;color:#f3ede4;"
    }text-decoration:none;font-weight:bold">${label}</a>`;
  // El cron puede mandarlo el mismo día (a alguien que pagó anoche): no puede decir "mañana".
  const faltan = Math.round((input.event.date.getTime() - Date.now()) / 36e5);
  const cuando = faltan <= 14 ? "Hoy es la cena" : "Mañana es la cena";
  const body = `
    <p>Hola ${esc(first)}. ${cuando}: <strong>${formatLong(input.event.date)}, ${formatTime(input.event.date)} hs</strong>.</p>
    ${input.event.address ? `<p style="font-size:18px"><strong>${input.event.address}</strong><br><span style="color:#9a9187;font-size:14px">Casa sin cartel: portón, pasillo y puerta. Se recibe de pie con un cóctel sin alcohol de la casa.</span></p>` : ""}
    <p>${input.quantity === 1 ? "Tu lugar" : `Tus ${input.quantity} lugares`}: ${
      input.seats.length ? `silla${input.seats.length > 1 ? "s" : ""} <strong>${input.seats.join(", ")}</strong>` : `<a href="${link}" style="color:#c9a96e">todavía no elegiste la silla, elegila acá</a>`
    }.</p>
    <p style="margin-top:24px">¿Nos confirmás con un toque? Cocinamos justo para los que vienen.</p>
    <p>${btn(`${link}?confirmo=1`, "Confirmo que voy")}${btn(noPuedo, "No voy a poder", false)}</p>
    <p style="color:#9a9187;font-size:14px">Si no podés venir, podés pasarle tu lugar a otra persona desde <a href="${link}" style="color:#c9a96e">tu reserva</a> (cambiás el nombre y le llega la confirmación).</p>`;
  const html = layout("Es mañana", body, `Tu reserva: <a href="${link}" style="color:#8a8279">${link}</a>`);
  return {
    subject: `${faltan <= 14 ? "Hoy" : "Mañana"} te esperamos · ${input.event.title} · ${formatTime(input.event.date)} hs`,
    html,
    text: toText(html),
  };
}

export async function sendReminder(input: ReminderInput & { to: string }) {
  if (!isEmailConfigured() || input.to.endsWith("@local")) return { skipped: true as const };
  const { error } = await sendMail({ to: input.to, ...renderReminder(input) });
  if (error) console.error("[email] recordatorio falló", error);
  return { skipped: false as const, error };
}

/** A quien estaba en lista de espera: se liberó un lugar; el que llega primero, reserva. */
export function renderSeatFreed(event: { id: string; title: string; date: Date; price: number }, name: string | null, free: number): RenderedMail {
  const first = name ? name.split(" ")[0] : null;
  const link = `${siteUrl()}/?fecha=${event.id}#reservar`;
  return withText({
    subject: `Se liberó un lugar · ${event.title} · ${formatLong(event.date)}`,
    html: layout(
      "Se liberó un lugar",
      `<p>${first ? `Hola ${first}. ` : "Hola. "}Estabas en la lista de espera para <strong>${event.title}</strong>, ${formatLong(event.date)}, ${formatTime(event.date)} hs, y se liberó ${free === 1 ? "un lugar" : "lugar"}.</p>
       <p>Es por orden de llegada: si querés venir, reservá ahora.</p>
       <p><a href="${link}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#c9a96e;color:#141210;text-decoration:none;font-weight:bold">Reservar mi lugar</a></p>
       <p style="color:#9a9187;font-size:14px">${formatPrice(event.price)} por persona. Si ya no podés, no hace falta que hagas nada.</p>`,
      "Recibís este mail porque te anotaste en la lista de espera de esa fecha.",
    ),
  });
}

/** Al admin: alguien avisó desde el recordatorio que no viene (el lugar ya quedó libre). */
export async function sendAdminDeclined(input: { name: string; email: string; phone: string | null; event: EventLike; eventId: string; quantity: number; amount: number }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!isEmailConfigured() || !adminEmail) return;
  const html = layout(
    "No viene",
    `<p><strong>${esc(input.name)}</strong> avisó desde el recordatorio que <strong>no va a poder ir</strong> a ${input.event.title} (${formatLong(input.event.date)}).</p>
     <p>${input.quantity === 1 ? "Su lugar quedó" : `Sus ${input.quantity} lugares quedaron`} libre${input.quantity === 1 ? "" : "s"} y, si hay lista de espera, ya les avisamos.</p>
     <p>Había pagado ${formatPrice(input.amount)}: lo de la devolución o el cambio de fecha se charla por WhatsApp (${input.phone ?? "sin teléfono"}) o al mail ${input.email}.</p>
     <p><a href="${siteUrl()}/admin/eventos/${input.eventId}" style="color:#c9a96e">Ver la cena en el panel</a></p>`,
  );
  const { error } = await sendMail({ to: adminEmail, subject: `No viene: ${input.name} (${input.quantity}) · ${input.event.title}`, html, text: toText(html) });
  if (error) console.error("[email] aviso no viene falló", error);
}

/** A quien recibe una cena de regalo, cuando el pago está confirmado: fecha, dirección, mensaje y el link para elegir silla. */
export type GiftInput = { giftName: string; from: string; message: string | null; event: EventLike; quantity: number; reservationId: string };

export function renderGiftCard(input: GiftInput): RenderedMail {
  const link = `${siteUrl()}/reserva/${input.reservationId}`;
  const first = input.giftName.split(" ")[0];
  const body = `
    <p style="font-size:18px">Hola ${first}. <strong>${input.from}</strong> te regaló una cena.</p>
    ${input.message ? `<blockquote style="margin:16px 0;padding:12px 16px;border-left:2px solid #c9a96e;color:#e6dfd3;font-style:italic">${esc(input.message)}</blockquote>` : ""}
    <p><strong>${input.event.title}</strong><br>${formatLong(input.event.date)}, ${formatTime(input.event.date)} hs${
      input.event.address ? `<br>${input.event.address}` : ""
    }<br>${input.quantity === 1 ? "1 lugar" : `${input.quantity} lugares`} a tu nombre. Está todo pago.</p>
    <p style="color:#c9a96e">Llegá ${formatTime(input.event.date)} hs. Se recibe de pie con un cóctel sin alcohol de la casa, y a la mesa se pasa un rato después.</p>
    ${menuHtml(input.event.menu)}
    <p><a href="${link}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#c9a96e;color:#141210;text-decoration:none;font-weight:bold">Ver mi reserva y elegir silla</a></p>
    ${
      CONTACT_PHONES.length
        ? `<p style="font-size:14px;color:#9a9187">Si no podés ese día, escribinos por WhatsApp: ${CONTACT_PHONES.map((p) => `<a href="${whatsappUrl(p)}" style="color:#c9a96e">${formatPhone(p)}</a>`).join(" · ")}</p>`
        : ""
    }`;
  const html = layout("Te regalaron una cena", body, `Tu reserva: <a href="${link}" style="color:#8a8279">${link}</a>`);
  return { subject: `${input.from} te regaló una cena · ${formatLong(input.event.date)}`, html, text: toText(html), ics: icsFor(input.event, link, input.reservationId) };
}

export async function sendGiftCard(input: GiftInput & { to: string }) {
  if (!isEmailConfigured() || input.to.endsWith("@local")) return { skipped: true as const };
  const { error } = await sendMail({ to: input.to, ...renderGiftCard(input) });
  if (error) console.error("[email] tarjeta de regalo falló", error);
  return { skipped: false as const, error };
}

/** Al admin, unos días antes: lo que le falta a la próxima cena (carta, dirección, secretos del juego, aviso). */
/** La receta de regalo, al día siguiente: texto libre (con saltos de línea) tal como lo cargaron en la cena. */
export function renderRecipeGift(event: EventLike, name: string, recipe: string): RenderedMail {
  const paras = recipe
    .split(/\n{2,}/)
    .map((p) => `<p style="white-space:pre-line">${esc(p.trim())}</p>`)
    .join("");
  return withText({
    subject: `La receta, de regalo · ${event.title}`,
    html: layout(
      "Para que la hagas en casa",
      `<p>Hola ${esc(name.split(" ")[0])}. Gracias por venir el ${formatLong(event.date).toLowerCase()}. Te dejamos una de las recetas de esa noche, tal cual la hacemos nosotros.</p>
       ${paras}
       <p style="margin-top:24px">Si la hacés, contanos cómo salió. Y si querés volver, la próxima fecha está en <a href="${siteUrl()}" style="color:#c9a96e">${siteUrl().replace(/^https?:\/\//, "")}</a>.</p>`,
      "Recibís este mail porque viniste a una de nuestras cenas.",
    ),
  });
}

export async function sendRecipeGifts(input: { event: EventLike; recipe: string; people: { name: string; email: string }[] }): Promise<{ sent: number; failed: number }> {
  const people = input.people.filter((p) => !p.email.endsWith("@local"));
  if (!isEmailConfigured() || people.length === 0) return { sent: 0, failed: 0 };
  return sendMany(people.map((p) => ({ to: p.email, ...renderRecipeGift(input.event, p.name, input.recipe) })));
}

export async function sendAdminMissing(input: { event: EventLike & { id: string }; missing: string[] }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!isEmailConfigured() || !adminEmail || input.missing.length === 0) return;
  const html = layout(
    `Falta esto para el ${formatLong(input.event.date).toLowerCase()}`,
    `<p><strong>${input.event.title}</strong> · ${formatLong(input.event.date)}, ${formatTime(input.event.date)} hs.</p>
     <ul>${input.missing.map((m) => `<li>${m}</li>`).join("")}</ul>
     <p><a href="${siteUrl()}/admin/eventos/${input.event.id}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#c9a96e;color:#141210;text-decoration:none;font-weight:bold">Completar en el panel</a></p>`,
    "Este aviso sale una vez por cena, unos días antes.",
  );
  const { error } = await sendMail({ to: adminEmail, subject: `Falta esto para ${input.event.title}: ${input.missing.length} cosa${input.missing.length === 1 ? "" : "s"}`, html, text: toText(html) });
  if (error) console.error("[email] aviso de faltantes falló", error);
}
