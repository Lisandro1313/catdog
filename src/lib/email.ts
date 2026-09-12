import { Resend } from "resend";
import { createHmac } from "node:crypto";
import { CONTACT_PHONES, SITE_NAME, formatPhone, formatPrice, siteUrl, whatsappUrl } from "./config";
import { formatLong, formatTime } from "./dates";

function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function from(): string {
  // Sin dominio verificado en Resend solo se puede mandar desde onboarding@resend.dev
  // y únicamente a la casilla dueña de la cuenta.
  return process.env.EMAIL_FROM ?? `${SITE_NAME} <onboarding@resend.dev>`;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

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
  return `<!doctype html><html><body style="margin:0;background:#141210;font-family:Georgia,serif;color:#f3ede4">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <p style="letter-spacing:.2em;text-transform:uppercase;font-size:12px;color:#c9a96e;margin:0 0 8px">${SITE_NAME}</p>
    <h1 style="font-size:28px;font-weight:normal;margin:0 0 24px">${title}</h1>
    <div style="font-size:16px;line-height:1.6;color:#e6dfd3">${body}</div>
    <hr style="border:0;border-top:1px solid #2c2823;margin:32px 0">
    <p style="font-size:12px;color:#8a8279">${footer}</p>
  </div></body></html>`;
}

type EventLike = { title: string; date: Date; price: number; description?: string | null; menu?: string | null; address?: string | null };

export async function sendReservationConfirmed(input: {
  to: string;
  name: string;
  event: EventLike;
  quantity: number;
  seats: number[];
  amount: number;
  reservationId: string;
}) {
  const r = resend();
  if (!r || input.to.endsWith("@local")) return { skipped: true as const };
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
    ${input.event.menu ? `<p><em>La noche, en pasos:</em><br>${input.event.menu.replace(/\n/g, "<br>")}</p>` : ""}
    ${
      CONTACT_PHONES.length
        ? `<p>Cualquier cosa, escribinos por WhatsApp: ${CONTACT_PHONES.map(
            (p) => `<a href="${whatsappUrl(p)}" style="color:#c9a96e">${formatPhone(p)}</a>`,
          ).join(" · ")}</p>`
        : ""
    }
    <p>Guardá este mail: tiene la dirección y el link de tu reserva.</p>`;
  const { error } = await r.emails.send({
    from: from(),
    to: input.to,
    subject: `Reserva confirmada · ${input.event.title} · ${formatLong(input.event.date)}`,
    html: layout("¡Reserva confirmada!", body, `Tu reserva: <a href="${link}" style="color:#8a8279">${link}</a>`),
  });
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
  const r = resend();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!r || !adminEmail) return;
  const body = `
    <p><strong>${input.name}</strong> reservó ${input.quantity} lugar${input.quantity > 1 ? "es" : ""}.</p>
    <p>${input.event.title} · ${formatLong(input.event.date)}</p>
    <p>Email: ${input.email}<br>Tel: ${input.phone ?? "-"}<br>Pagó ${formatPrice(input.amount)} vía ${input.via}.</p>
    ${input.notes ? `<p><em>Nos avisa:</em> ${input.notes}</p>` : ""}
    <p><a href="${siteUrl()}/admin" style="color:#c9a96e">Ver panel</a></p>`;
  const { error } = await r.emails.send({
    from: from(),
    to: adminEmail,
    subject: `Nueva reserva: ${input.name} (${input.quantity})`,
    html: layout("Nueva reserva", body),
  });
  if (error) console.error("[email] aviso admin falló", error);
}

export async function sendNewEventBlast(input: {
  emails: string[];
  event: EventLike;
}): Promise<{ sent: number; failed: number }> {
  const r = resend();
  if (!r || input.emails.length === 0) return { sent: 0, failed: 0 };

  const subject = `Nueva fecha: ${input.event.title} · ${formatLong(input.event.date)}`;
  const messages = input.emails.map((email) => ({
    from: from(),
    to: email,
    subject,
    html: layout(
      "Hay nueva fecha",
      `<p><strong>${input.event.title}</strong><br>
       ${formatLong(input.event.date)} · ${formatTime(input.event.date)} hs<br>
       ${formatPrice(input.event.price)} por persona.</p>
       ${input.event.description ? `<p>${input.event.description.replace(/\n/g, "<br>")}</p>` : ""}
       <p>Son pocos lugares. Reservá el tuyo acá:<br>
       <a href="${siteUrl()}" style="color:#c9a96e">${siteUrl()}</a></p>`,
      `Recibís este mail porque te anotaste para enterarte de nuevas fechas. <a href="${unsubscribeUrl(email)}" style="color:#8a8279">Darse de baja</a>.`,
    ),
  }));

  let sent = 0;
  let failed = 0;
  // Resend permite hasta 100 mails por batch.
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const { error } = await r.batch.send(chunk);
    if (error) {
      console.error("[email] batch falló", error);
      failed += chunk.length;
    } else {
      sent += chunk.length;
    }
  }
  return { sent, failed };
}
