/**
 * ¿Está abierto ahora?
 *
 * Es lo primero que mira el que abre la página de un bar un viernes a las once de la noche, y
 * hasta ahora había que leer "Lunes, jueves, viernes y sábados, desde las 20 hs" y sacar la cuenta.
 *
 * Los días y la hora salen del texto libre que se carga en Ajustes: no hay un campo estructurado y
 * no vale la pena inventarlo, porque ese texto es el que además se muestra tal cual en la página.
 * Lo que sí hace falta es que se lea bien, y para eso están los tests.
 */

// Argentina no tiene horario de verano desde 2009: UTC-3 fijo. Mismo criterio que dates.ts.
const AR_OFFSET_MS = 3 * 60 * 60 * 1000;

/** 0 = domingo, como getUTCDay. */
export const NOMBRE_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;

// Por prefijo sin acentos, así entra "sábados", "sabado", "Miércoles" y "mie".
const PREFIJOS: [string, number][] = [
  ["dom", 0],
  ["lun", 1],
  ["mar", 2],
  ["mie", 3],
  ["jue", 4],
  ["vie", 5],
  ["sab", 6],
];

function sinAcentos(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/gu, "").toLowerCase();
}

/** Qué días abre, leídos de "Lunes, jueves, viernes y sábados". Ordenados, sin repetir. */
export function diasQueAbre(texto: string): number[] {
  const limpio = sinAcentos(texto);
  const dias = new Set<number>();
  for (const [prefijo, n] of PREFIJOS) {
    if (new RegExp(`\\b${prefijo}`, "u").test(limpio)) dias.add(n);
  }
  return [...dias].sort((a, b) => a - b);
}

/** La hora de apertura, leída de "Desde las 20 hs" o "20:30". Null si no se entiende. */
export function horaDeApertura(texto: string): number | null {
  const m = texto.match(/(\d{1,2})(?::(\d{2}))?/u);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (h > 23 || min > 59) return null;
  return h + min / 60;
}

/** "20" o "20:30", para mostrar. */
export function comoHora(h: number): string {
  const horas = Math.floor(h);
  const min = Math.round((h - horas) * 60);
  return min === 0 ? String(horas) : `${horas}:${String(min).padStart(2, "0")}`;
}

/**
 * Hasta qué hora de la madrugada siguiente se considera que la noche sigue siendo la de ayer.
 * A las dos de la mañana de un sábado la casa está abierta: es la noche del viernes.
 */
export const FIN_DE_LA_NOCHE = 4;

export type Estado =
  | { abierto: true }
  | { abierto: false; abre: { dia: number; hoy: boolean; hora: number } | null };

/** Si está abierto ahora mismo, y si no, cuándo vuelve a abrir. `ahora` en hora real (UTC). */
export function estadoAhora(dias: number[], hora: number, ahora: Date = new Date()): Estado {
  if (dias.length === 0 || hora === null) return { abierto: false, abre: null };
  const ar = new Date(ahora.getTime() - AR_OFFSET_MS);
  const dia = ar.getUTCDay();
  const h = ar.getUTCHours() + ar.getUTCMinutes() / 60;

  // La noche de ayer que todavía no terminó.
  const ayer = (dia + 6) % 7;
  if (h < FIN_DE_LA_NOCHE && dias.includes(ayer)) return { abierto: true };
  // La de hoy, ya empezada.
  if (dias.includes(dia) && h >= hora) return { abierto: true };
  // Hoy abre más tarde.
  if (dias.includes(dia) && h < hora) return { abierto: false, abre: { dia, hoy: true, hora } };

  for (let i = 1; i <= 7; i++) {
    const d = (dia + i) % 7;
    if (dias.includes(d)) return { abierto: false, abre: { dia: d, hoy: false, hora } };
  }
  return { abierto: false, abre: null };
}

/** El cartelito: "Abierto ahora", "Hoy abre a las 20", "Abre el jueves a las 20". */
export function textoDeEstado(e: Estado): string {
  if (e.abierto) return "Abierto ahora";
  if (!e.abre) return "";
  return e.abre.hoy
    ? `Hoy abre a las ${comoHora(e.abre.hora)}`
    : `Abre el ${NOMBRE_DIA[e.abre.dia]} a las ${comoHora(e.abre.hora)}`;
}

/** Los días como los quiere schema.org, para que Google muestre el horario. */
export const SCHEMA_DIA = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export function horarioSchema(dias: number[], hora: number): { dayOfWeek: string[]; opens: string; closes: string } | null {
  if (dias.length === 0) return null;
  const hh = (n: number) => `${String(Math.floor(n)).padStart(2, "0")}:${String(Math.round((n - Math.floor(n)) * 60)).padStart(2, "0")}`;
  return {
    dayOfWeek: dias.map((d) => SCHEMA_DIA[d]),
    opens: hh(hora),
    closes: hh(FIN_DE_LA_NOCHE),
  };
}
