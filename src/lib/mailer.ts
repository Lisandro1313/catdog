import { Resend } from "resend";
import nodemailer, { type Transporter } from "nodemailer";
import { SITE_NAME } from "./config";

/**
 * Transporte de mails. Dos caminos, los dos gratis:
 * - Gmail (SMTP con contraseña de aplicación): manda a cualquiera sin necesidad de dominio propio.
 *   Variables: GMAIL_USER, GMAIL_APP_PASSWORD. Tiene prioridad si está cargado.
 * - Resend: sin dominio verificado solo puede mandar a la casilla dueña de la cuenta.
 *   Variables: RESEND_API_KEY y, con dominio verificado, EMAIL_FROM.
 */
export type Mail = { to: string; subject: string; html: string };
export type MailResult = { error: { message: string } | null };

export type MailMode = "gmail" | "resend" | "none";

export function mailMode(): MailMode {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return "gmail";
  if (process.env.RESEND_API_KEY) return "resend";
  return "none";
}

export function mailModeLabel(): string {
  const m = mailMode();
  if (m === "gmail") return `Gmail (${process.env.GMAIL_USER})`;
  if (m === "resend") return process.env.EMAIL_FROM ? "Resend (dominio propio)" : "Resend sin dominio: solo llega a tu casilla";
  return "No configurado";
}

export function isEmailConfigured(): boolean {
  return mailMode() !== "none";
}

/** Solo Resend sin dominio verificado tiene esta limitación. */
export function emailReachesEveryone(): boolean {
  const m = mailMode();
  return m === "gmail" || (m === "resend" && Boolean(process.env.EMAIL_FROM));
}

function from(): string {
  if (mailMode() === "gmail") return `${SITE_NAME} <${process.env.GMAIL_USER}>`;
  // Sin dominio verificado en Resend solo se puede mandar desde onboarding@resend.dev.
  return process.env.EMAIL_FROM ?? `${SITE_NAME} <onboarding@resend.dev>`;
}

let gmail: Transporter | null = null;
function gmailTransport(): Transporter {
  if (!gmail) {
    gmail = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }
  return gmail;
}

export async function sendMail(mail: Mail): Promise<MailResult> {
  const mode = mailMode();
  if (mode === "none") return { error: { message: "mails no configurados" } };
  try {
    if (mode === "gmail") {
      await gmailTransport().sendMail({ from: from(), to: mail.to, subject: mail.subject, html: mail.html });
      return { error: null };
    }
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: from(), ...mail });
    return { error: error ? { message: error.message } : null };
  } catch (err) {
    return { error: { message: err instanceof Error ? err.message : String(err) } };
  }
}

/** Varios mails; devuelve cuántos salieron y cuántos fallaron. */
export async function sendMany(mails: Mail[]): Promise<{ sent: number; failed: number }> {
  const mode = mailMode();
  if (mode === "none" || mails.length === 0) return { sent: 0, failed: mails.length };

  if (mode === "resend") {
    const r = new Resend(process.env.RESEND_API_KEY);
    let sent = 0;
    let failed = 0;
    // Resend permite hasta 100 mails por batch.
    for (let i = 0; i < mails.length; i += 100) {
      const chunk = mails.slice(i, i + 100).map((m) => ({ from: from(), ...m }));
      const { error } = await r.batch.send(chunk);
      if (error) {
        console.error("[email] batch falló", error);
        failed += chunk.length;
      } else sent += chunk.length;
    }
    return { sent, failed };
  }

  // Gmail: de a uno, con un respiro entre mails para no pasarnos del límite por minuto.
  let sent = 0;
  let failed = 0;
  for (const m of mails) {
    const { error } = await sendMail(m);
    if (error) {
      console.error("[email] falló", m.to, error.message);
      failed++;
    } else sent++;
    if (mails.length > 20) await new Promise((r) => setTimeout(r, 300));
  }
  return { sent, failed };
}
