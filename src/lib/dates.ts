import { TIMEZONE } from "./config";

// Argentina no tiene horario de verano desde 2009: UTC-3 fijo.
const AR_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Devuelve una Date cuyos getters UTC representan la fecha/hora en Argentina. */
function toArgentina(date: Date): Date {
  return new Date(date.getTime() - AR_OFFSET_MS);
}

/** Interpreta un valor de <input type="datetime-local"> como hora argentina. */
export function parseArgentinaLocal(value: string): Date {
  // value: "2026-09-12T21:00"
  return new Date(`${value}:00-03:00`);
}

/** Convierte una Date a string para <input type="datetime-local"> en hora argentina. */
export function toDatetimeLocal(date: Date): string {
  const ar = toArgentina(date);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${ar.getUTCFullYear()}-${p(ar.getUTCMonth() + 1)}-${p(ar.getUTCDate())}T${p(ar.getUTCHours())}:${p(ar.getUTCMinutes())}`;
}

/** "Sábado 12 de septiembre" (primera letra en mayúscula). */
export function formatLong(date: Date): string {
  const s = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIMEZONE,
  }).format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIMEZONE,
  }).format(date);
}

export function formatShort(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIMEZONE,
  }).format(date);
}

export type WeekDay = {
  label: string; // "lun"
  dayNumber: number; // 12
  isEventDay: boolean;
  isToday: boolean;
  isPast: boolean;
};

export type WeekView = {
  days: WeekDay[];
  /** Días que faltan hasta el evento (0 = es hoy, negativo = ya pasó). */
  daysUntil: number;
  /** Si hoy cae dentro de la semana del evento. */
  todayInWeek: boolean;
};

/** Medianoche argentina (en ms UTC) del día en que cae la fecha. */
function argentinaDayStart(date: Date): number {
  const ar = toArgentina(date);
  return Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth(), ar.getUTCDate());
}

/** El día argentino de una fecha, como Date a medianoche UTC (para columnas @db.Date). */
export function argentinaDay(date: Date = new Date()): Date {
  return new Date(argentinaDayStart(date));
}

export function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(date);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Los 7 días (lunes a domingo) de la semana en la que cae el evento, con hoy marcado. */
export function weekOf(date: Date, now: Date = new Date()): WeekView {
  const ar = toArgentina(date);
  // getUTCDay: 0=domingo. Queremos lunes=0.
  const dow = (ar.getUTCDay() + 6) % 7;
  const eventDay = argentinaDayStart(date);
  const monday = eventDay - dow * DAY_MS;
  const today = argentinaDayStart(now);
  const labels = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
  const days = labels.map((label, i) => {
    const d = monday + i * DAY_MS;
    return {
      label,
      dayNumber: new Date(d).getUTCDate(),
      isEventDay: i === dow,
      isToday: d === today,
      isPast: d < today,
    };
  });
  return {
    days,
    daysUntil: Math.round((eventDay - today) / DAY_MS),
    todayInWeek: today >= monday && today < monday + 7 * DAY_MS,
  };
}

export function monthName(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: TIMEZONE,
  }).format(date);
}

/** Envuelto para poder usarlo en Server Components (la regla de pureza de React marca Date.now directo). */
export function nowMs(): number {
  return Date.now();
}
