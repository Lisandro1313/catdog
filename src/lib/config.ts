export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "CatDog";
export const SITE_TAGLINE =
  process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "Cena a puertas cerradas · La Plata";
export const SITE_INTRO =
  process.env.NEXT_PUBLIC_SITE_INTRO ??
  "Una experiencia de sabores para tu fin de semana: un recorrido gourmet de cinco pasos, cada plato con su trago, en una sola mesa larga y con pocos lugares. Una salida distinta, a puertas cerradas.";

/** Teléfonos de consulta. Solo se muestran a quien ya pagó (página de reserva y mail). */
export const CONTACT_PHONES = (process.env.NEXT_PUBLIC_CONTACT_PHONES ?? "2215654325,2214388852")
  .split(",")
  .map((p) => p.replace(/\D/g, ""))
  .filter(Boolean);

/** "2215654325" -> "221 565-4325" */
export function formatPhone(digits: string): string {
  if (digits.length === 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
}

/** Link a WhatsApp con prefijo de Argentina para celulares (+54 9). */
export function whatsappUrl(digits: string, text?: string): string {
  const base = `https://wa.me/549${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
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
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}
