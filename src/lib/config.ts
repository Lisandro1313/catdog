export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "CatDog";
export const SITE_TAGLINE =
  process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "Cena a puertas cerradas · La Plata";
export const SITE_INTRO =
  process.env.NEXT_PUBLIC_SITE_INTRO ??
  "Una experiencia de sabores para tu fin de semana: un recorrido gourmet en pasos, cada plato con su trago pensado al lado. Una salida distinta, a puertas cerradas.";

/** Teléfonos de consulta. Solo se muestran a quien ya pagó (página de reserva y mail). */
export const CONTACT_PHONES = (process.env.NEXT_PUBLIC_CONTACT_PHONES ?? "2215654325,2214388852")
  .split(",")
  .map((p) => p.replace(/\D/g, ""))
  .filter(Boolean);

/** "2215654325" -> "221 565-4325" */
export function formatPhone(raw: string): string {
  const digits = normalizeArPhone(raw);
  if (digits.length === 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return raw;
}

/** Link a WhatsApp con prefijo de Argentina para celulares (+54 9). */
export function whatsappUrl(raw: string, text?: string): string {
  const base = `https://wa.me/549${normalizeArPhone(raw)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Mail de contacto público: la misma casilla desde la que salen los mails (o una explícita). Vacío = no se muestra. */
export function contactEmail(): string {
  return (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? process.env.GMAIL_USER ?? "").trim();
}

/** Precio por defecto por persona (ARS) al crear un evento nuevo. */
export const DEFAULT_PRICE = 21000;
export const DEFAULT_CAPACITY = 15;

/** Cuántos lugares puede tomar una sola reserva. */
export const MAX_SEATS_PER_RESERVATION = 4;

/** Minutos que se mantienen los lugares mientras el pago está pendiente. */
export const HOLD_MINUTES = 30;

export const TIMEZONE = "America/Argentina/Buenos_Aires";

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd}`;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export function formatPrice(amount: number): string {
  const s = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
  // Intl mete un espacio duro entre el signo y el número; acá se escribe pegado: $40.000.
  return s.replace(/^(\D+)\s+/u, "$1");
}

/**
 * Deja un celular argentino como 10 dígitos (área + número), que es lo que espera wa.me con el 549 adelante.
 * Acepta "+54 9 221 555-1234", "0221 15 555 1234", "221 5551234", etc. Si no se entiende, devuelve solo los dígitos.
 */
export function normalizeArPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("54")) d = d.slice(2);
  if (d.startsWith("9") && d.length > 10) d = d.slice(1);
  if (d.startsWith("0")) d = d.slice(1);
  // "15" después del código de área (2 a 4 dígitos)
  for (const pos of [2, 3, 4]) {
    if (d.length === 12 && d.slice(pos, pos + 2) === "15") {
      d = d.slice(0, pos) + d.slice(pos + 2);
      break;
    }
  }
  return d;
}
