/**
 * ¿Está abierto ahora?
 *
 * Es lo primero que mira el que abre la página de un bar un viernes a las once de la noche, y
 * hasta ahora había que leer "Lunes, jueves, viernes y sábados, desde las 20 hs" y sacar la cuenta.
 *
 * Hay dos fuentes y una manda sobre la otra:
 *  - La semana de siempre, leída del texto libre que se carga en Ajustes. No hay un campo
 *    estructurado y no vale la pena inventarlo, porque ese texto además se muestra tal cual.
 *  - La excepción de un día: "este jueves abrimos de 20 a 3" o "hoy no abrimos". Es lo que pasa
 *    de verdad en una casa: se abre un martes porque sí, o se cierra un feriado.
 */

// Argentina no tiene horario de verano desde 2009: UTC-3 fijo. Mismo criterio que dates.ts.
const AR_OFFSET_MS = 3 * 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;

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

/**
 * Un día puntual que no sigue la semana de siempre.
 * `fecha` es el día argentino en formato "YYYY-MM-DD"; si `abre` es false, ese día se cierra
 * aunque toque abrir. `hasta` puede caer en la madrugada del día siguiente (3 = las 3 am).
 */
export type Excepcion = { fecha: string; abre: boolean; desde: number; hasta: number | null };

export type Estado =
  | { abierto: true; hasta: number | null }
  | { abierto: false; abre: { dia: number; hoy: boolean; desde: number; hasta: number | null } | null };

/** El día argentino de una fecha, como "YYYY-MM-DD". */
function diaAr(ahora: Date): string {
  return new Date(ahora.getTime() - AR_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Si está abierto ahora mismo, y si no, cuándo vuelve a abrir.
 * `ahora` va en hora real (UTC); la cuenta se hace en hora argentina.
 */
export function estadoAhora(dias: number[], hora: number, ahora: Date = new Date(), excepcion: Excepcion | null = null): Estado {
  const ar = new Date(ahora.getTime() - AR_OFFSET_MS);
  const dia = ar.getUTCDay();
  const h = ar.getUTCHours() + ar.getUTCMinutes() / 60;
  const hoy = diaAr(ahora);
  const ayer = diaAr(new Date(ahora.getTime() - DIA_MS));
  const exc = excepcion && (excepcion.fecha === hoy || excepcion.fecha === ayer) ? excepcion : null;

  // --- la noche de ayer, que todavía no terminó ---
  const diaDeAyer = (dia + 6) % 7;
  if (h < FIN_DE_LA_NOCHE) {
    if (exc?.fecha === ayer) {
      // La excepción de ayer manda sobre la semana de siempre, para los dos lados.
      if (exc.abre && h < (exc.hasta ?? FIN_DE_LA_NOCHE)) return { abierto: true, hasta: exc.hasta };
    } else if (dias.includes(diaDeAyer)) {
      return { abierto: true, hasta: null };
    }
  }

  // --- hoy ---
  const abreHoy = exc?.fecha === hoy ? exc.abre : dias.includes(dia);
  const desdeHoy = exc?.fecha === hoy ? exc.desde : hora;
  const hastaHoy = exc?.fecha === hoy ? exc.hasta : null;
  if (abreHoy && h >= desdeHoy) return { abierto: true, hasta: hastaHoy };
  if (abreHoy) return { abierto: false, abre: { dia, hoy: true, desde: desdeHoy, hasta: hastaHoy } };

  // --- el próximo día que abre ---
  // Una excepción de hoy que cierra no se arrastra a mañana: mañana vuelve la semana de siempre.
  if (excepcion?.abre && excepcion.fecha > hoy) {
    const d = new Date(`${excepcion.fecha}T12:00:00Z`).getUTCDay();
    const proximoDeLaSemana = siguienteDeLaSemana(dias, dia);
    // Si la excepción cae antes que el próximo día de siempre, es la que hay que anunciar.
    if (proximoDeLaSemana === null || diasHasta(dia, d) <= diasHasta(dia, proximoDeLaSemana)) {
      return { abierto: false, abre: { dia: d, hoy: false, desde: excepcion.desde, hasta: excepcion.hasta } };
    }
  }
  const proximo = siguienteDeLaSemana(dias, dia);
  if (proximo === null) return { abierto: false, abre: null };
  return { abierto: false, abre: { dia: proximo, hoy: false, desde: hora, hasta: null } };
}

function diasHasta(desde: number, hasta: number): number {
  return (hasta - desde + 7) % 7 || 7;
}

function siguienteDeLaSemana(dias: number[], hoy: number): number | null {
  for (let i = 1; i <= 7; i++) {
    const d = (hoy + i) % 7;
    if (dias.includes(d)) return d;
  }
  return null;
}

/** El cartelito: "Abierto ahora", "Abierto hasta las 3", "Hoy de 20 a 3", "Abre el jueves a las 20". */
export function textoDeEstado(e: Estado): string {
  if (e.abierto) return e.hasta === null ? "Abierto ahora" : `Abierto hasta las ${comoHora(e.hasta)}`;
  if (!e.abre) return "";
  const franja = e.abre.hasta === null ? `a las ${comoHora(e.abre.desde)}` : `de ${comoHora(e.abre.desde)} a ${comoHora(e.abre.hasta)}`;
  return e.abre.hoy ? `Hoy abre ${franja}` : `Abre el ${NOMBRE_DIA[e.abre.dia]} ${franja}`;
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
