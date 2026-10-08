/**
 * Tipos y formato chico del guion de ¿Quién te contó?. Sin datos de historia: eso vive en
 * `historia/*` (las cinco semanas, los finales, la acusación), `confidentes/*` (los vínculos con
 * rangos) y `tablero.ts` (las pistas del traidor).
 *
 * Formato de líneas:
 *
 *   vera/picara: Texto          → habla Vera, con cara pícara
 *   vera!: Texto                → habla Vera con "golpe" (sacudón + sonido)
 *   Texto suelto                → narración
 *   !Texto suelto               → narración con golpe
 *   [marca] ...                 → la línea solo sale si se tiene esa marca
 *   [-marca] ...                → la línea solo sale si NO se tiene esa marca
 *   [en:vera] ...               → solo si el romance con Vera está vivo
 *   [rango:vera:5] ...          → solo si Vera está en rango 5 o más ([-rango:vera:5]: menos de 5)
 *   [stat:labia:3] ...          → solo con Labia 3 o más
 *   [@salvada] ...              → una condición con nombre (ver `DERIVADAS`)
 *
 * `{nombre}` se reemplaza por el nombre que puso quien juega.
 */

/** Los vínculos: rangos del 1 al 10, una escena por rango. */
export const CONFIDENTES = ["vera", "teo", "mora", "dante", "sol", "luna", "bruno", "cami", "evelyn"] as const;
export type Confidente = (typeof CONFIDENTES)[number];
export const RANGO_MAX = 10;
/** Los que se conocen la primera semana. El resto aparece después (marca `conoce:x`). */
export const CONOCIDOS: readonly Confidente[] = ["vera", "teo", "mora"];

/**
 * El traidor: alguien de la casa le pasa información a Altamira. Cambia en cada partida (se sortea
 * al empezar y queda como marca `traidor:x`). Dante es la pista falsa obvia: nunca es. Lisandro y
 * Agustín ni siquiera son sospechosos.
 */
export const TRAIDORES = ["vera", "teo", "mora", "cami"] as const;
export type Traidor = (typeof TRAIDORES)[number];
/** Los que aparecen en el tablero (los posibles y las pistas falsas). */
export const SOSPECHOSOS = ["vera", "teo", "mora", "cami", "dante", "bruno"] as const;
export type Sospechoso = (typeof SOSPECHOSOS)[number];

/** Cualidades de quien juega (a la manera de Persona). */
export const STATS = ["encanto", "coraje", "labia"] as const;
export type Stat = (typeof STATS)[number];
export const STAT_MAX = 6;

export const HABLANTES = [
  "narra",
  "yo",
  "vera",
  "teo",
  "mora",
  "gris",
  "gervasio",
  "lisandro",
  "agustin",
  "gato",
  "dante",
  "sol",
  "amalia",
  "luna",
  "bruno",
  "cami",
  "evelyn",
] as const;
export type Hablante = (typeof HABLANTES)[number];
export type Quien = Exclude<Hablante, "narra" | "yo">;

export const CARAS = ["normal", "feliz", "sonrisa", "picara", "triste", "enojo", "sorpresa", "serio", "sonrojo", "guino"] as const;
export type Cara = (typeof CARAS)[number];

export const FONDOS = [
  "puerta",
  "barra",
  "pool",
  "cocina",
  "vereda",
  "pasillo",
  "plaza",
  "rana",
  "terraza",
  "ensayo",
  "guardia",
  "diagonal",
  "oscuro",
  "bosque",
  "oficina",
  "depto",
  "cabina",
  "zaguan",
  "estudio",
  "velas",
] as const;
export type Fondo = (typeof FONDOS)[number];

/** Escenas ilustradas: se desbloquean en la galería. */
export const CGS = [
  "cg-sol-techo",
  "cg-beso",
  "cg-vera-barra",
  "cg-fiesta",
  "cg-apagon",
  "cg-duelo",
  "cg-vera",
  "cg-teo",
  "cg-mora",
  "cg-dante",
  "cg-sol",
  "cg-luna",
  "cg-bruno",
  "cg-cami",
  "cg-evelyn",
  "cg-celos",
  "cg-casa",
  "cg-gervasio",
] as const;
export type CgId = (typeof CGS)[number];

export const DIAS = ["lunes", "jueves", "viernes", "sabado", "epilogo"] as const;
export type Dia = (typeof DIAS)[number];

/** Cinco semanas, un capítulo cada una. La firma es el sábado de la quinta. */
export const SEMANAS = 5;

export type Condicion =
  | { rango: Confidente; min: number }
  | { stat: Stat; min: number }
  | { marca: string }
  | { no: string }
  | { ni: Condicion }
  | { todas: Condicion[] }
  | { alMenos: number; de: Condicion[] };

export type Linea = {
  /** Único en todo el guion: sirve para "saltar leídos". Lleva un pedacito del texto: si la línea cambia, deja de contar como leída. */
  id: string;
  quien: Hablante;
  cara: Cara;
  texto: string;
  golpe: boolean;
  si?: Condicion;
};

export type Opcion = {
  texto: string;
  stats?: Partial<Record<Stat, number>>;
  marcas?: string[];
  /** Si no se cumple, la opción no aparece. */
  requiere?: Condicion;
  /** Tiempo libre: ir a ver a este confidente (al próximo rango que toque). */
  rango?: Confidente;
  /** Lo que pasa justo después de elegir (puede estar vacío). */
  respuesta: Linea[];
  /** A dónde va después. Si falta, a `sigue` de la escena. "@final" = calcular el final; "@vuelta" = volver. */
  va?: string;
};

export type Escena = {
  id: string;
  /** Si falta (escenas de vínculo), es el día de la escena a la que se vuelve. */
  dia?: Dia;
  /** Semana (= capítulo) 1 a 5. Si falta, la de la vuelta. */
  semana?: number;
  /** Tiempo libre de viernes y sábado: 1 = antes de la una, 2 = de madrugada. */
  turno?: 1 | 2;
  fondo: Fondo;
  hora: string;
  /** Marca (o marcas) que se ganan con solo entrar a la escena. */
  marca?: string | string[];
  /** Escena ilustrada (reemplaza fondo y retrato). */
  cg?: CgId;
  /** Los personajes con ropa de salir. */
  noche?: boolean;
  /** Tiempo libre: elegir cualquier opción deja anotado volver a `sigue`. */
  libre?: boolean;
  /** La acusación: la pantalla la muestra a la manera de un interrogatorio. */
  acusar?: boolean;
  /** Escena de vínculo: entrar sube el rango. */
  rango?: { de: Confidente; n: number };
  /** Lo que pide la escena de vínculo para estar disponible, y cómo se explica si falta. */
  pide?: Condicion;
  motivo?: string;
  /** Lo que trae este rango, contado sin spoilers (se ve en el panel de vínculos antes de ir). */
  premio?: string;
  /** Desvíos al terminar (el primero que se cumple). Al tomar uno, se vuelve después a `sigue`. */
  ramas?: { si: Condicion; va: string }[];
  lineas: Linea[];
  opciones?: Opcion[];
  sigue?: string;
  /** Si la escena es el cierre de un final: al terminarla, se termina el juego. */
  fin?: FinalId;
  /** Tema de música a la fuerza. Si falta, lo decide `temaDeEscena` (ver `musica.ts`). */
  musica?: TemaNovela;
};

/** Los temas de fondo (public/musica). Mismos nombres que `Tema` de components/jugar/musica.ts. */
export const TEMAS_NOVELA = ["barra", "noche", "melancolia", "jazz-suave", "brass", "misterio"] as const;
export type TemaNovela = (typeof TEMAS_NOVELA)[number];

export const FINALES_IDS = [
  "verdadero",
  "celos",
  "engano",
  "amor-vera",
  "amor-teo",
  "amor-mora",
  "amor-dante",
  "amor-sol",
  "amor-luna",
  "amor-bruno",
  "amor-cami",
  "amor-evelyn",
  "silla",
  "casa",
  "abrigo",
  "cerrado",
] as const;
export type FinalId = (typeof FINALES_IDS)[number];

export type Final = {
  id: FinalId;
  titulo: string;
  /** Lo que se ve en la lista de finales cuando todavía no se consiguió. */
  pista: string;
  verdadero?: boolean;
  condicion: Condicion;
  escena: string;
};

// ─── Condiciones con nombre ──────────────────────────────────────────────────────────────────

const SALVADA: Condicion = { todas: [{ marca: "acuso:bien" }, { marca: "carta:amalia" }] };

/**
 * Condiciones que se usan mucho en el guion, con nombre: `[@salvada]`, `[-@salvada]`.
 * - salvada: acusaste bien y Amalia supo la verdad a tiempo. La casa no se vende.
 * - catalogada: no se salvó, pero Cami logró que no se pueda tirar.
 * - perdida: ni una cosa ni la otra.
 * - desconfianza: la casa se enteró por otro de dónde trabajaste, y nunca se lo contaste vos.
 */
export const DERIVADAS: Record<string, Condicion> = {
  salvada: SALVADA,
  catalogada: { todas: [{ ni: SALVADA }, { marca: "patrimonio" }] },
  perdida: { todas: [{ ni: SALVADA }, { no: "patrimonio" }] },
  desconfianza: { todas: [{ marca: "expuesto" }, { no: "confeso" }] },
};

// ─── El formato chico ────────────────────────────────────────────────────────────────────────

const ES_HABLANTE = new Set<string>(HABLANTES);
const ES_CARA = new Set<string>(CARAS);
const ES_CONFIDENTE = new Set<string>(CONFIDENTES);
const ES_STAT = new Set<string>(STATS);

/** Un hash chiquito y estable del texto (para que una línea reescrita no cuente como "ya leída"). */
function huella(t: string): string {
  let h = 5381;
  for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36).slice(0, 5);
}

/** Lee una condición entre corchetes: `marca`, `en:vera`, `rango:vera:5`, `stat:labia:3`, `@salvada`. */
function condicionDe(neg: boolean, raw: string, donde: string): Condicion {
  const partes = raw.split(":");
  let c: Condicion | null = null;
  if (raw.startsWith("@")) {
    c = DERIVADAS[raw.slice(1)] ?? null;
    if (!c) throw new Error(`Condición con nombre desconocida "${raw}" en ${donde}`);
  } else if (partes[0] === "en" && partes.length === 2 && ES_CONFIDENTE.has(partes[1])) {
    c = enPareja(partes[1] as Confidente);
  } else if (partes[0] === "rango" && partes.length === 3) {
    if (!ES_CONFIDENTE.has(partes[1]) || !Number(partes[2])) throw new Error(`Condición rara "${raw}" en ${donde}`);
    c = { rango: partes[1] as Confidente, min: Number(partes[2]) };
  } else if (partes[0] === "stat" && partes.length === 3) {
    if (!ES_STAT.has(partes[1]) || !Number(partes[2])) throw new Error(`Condición rara "${raw}" en ${donde}`);
    c = { stat: partes[1] as Stat, min: Number(partes[2]) };
  }
  if (c) return neg ? { ni: c } : c;
  return neg ? { no: raw } : { marca: raw };
}

export function parseLineas(base: string, src: string): Linea[] {
  return src
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((raw, i) => {
      let t = raw;
      const conds: Condicion[] = [];
      const id = `${base}:${i}`;
      for (let cond = /^\[(-?)(@?[\w:-]+)\]\s*/.exec(t); cond; cond = /^\[(-?)(@?[\w:-]+)\]\s*/.exec(t)) {
        const [, neg, marca] = cond;
        conds.push(condicionDe(!!neg, marca, id));
        t = t.slice(cond[0].length);
      }
      const si: Condicion | undefined = conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : { todas: conds };
      const lid = `${id}.${huella(t)}`;
      const m = /^([a-z]+)(?:\/([a-z]+))?(!)?:\s+/.exec(t);
      if (m && ES_HABLANTE.has(m[1])) {
        const cara = m[2] ?? "normal";
        if (!ES_CARA.has(cara)) throw new Error(`Cara desconocida "${cara}" en ${id}`);
        return { id: lid, quien: m[1] as Hablante, cara: cara as Cara, texto: t.slice(m[0].length), golpe: !!m[3], ...(si ? { si } : {}) };
      }
      const golpe = t.startsWith("!");
      return { id: lid, quien: "narra" as const, cara: "normal" as const, texto: golpe ? t.slice(1).trim() : t, golpe, ...(si ? { si } : {}) };
    });
}

export type OpcionSrc = Omit<Opcion, "respuesta"> & { respuesta?: string };
export type EscenaSrc = Omit<Escena, "lineas" | "opciones" | "id"> & { texto: string; opciones?: OpcionSrc[] };

export function armar(src: Record<string, EscenaSrc>): Record<string, Escena> {
  const out: Record<string, Escena> = {};
  for (const [id, e] of Object.entries(src)) {
    const { texto, opciones, ...resto } = e;
    out[id] = {
      ...resto,
      id,
      lineas: parseLineas(id, texto),
      ...(opciones ? { opciones: opciones.map((o, k) => ({ ...o, respuesta: parseLineas(`${id}:o${k}`, o.respuesta ?? "") })) } : {}),
    };
  }
  return out;
}

export type RangoSrc = Omit<EscenaSrc, "rango" | "dia" | "semana"> & { pide?: Condicion; motivo?: string; premio: string };

/**
 * Arma las diez escenas de un confidente: ids `vera-r1` … `vera-r10`, suben el rango al entrar y
 * vuelven solas a donde estaba la noche (`@vuelta`). Un rango puede seguir en una segunda escena
 * (`sigue: "vera-r6-b"`) que es la que vuelve.
 */
export function armarRangos(de: Confidente, lista: RangoSrc[]): Record<string, Escena> {
  if (lista.length !== RANGO_MAX) throw new Error(`${de}: tiene ${lista.length} rangos, se esperaban ${RANGO_MAX}`);
  const src: Record<string, EscenaSrc> = {};
  lista.forEach((r, i) => {
    src[`${de}-r${i + 1}`] = { sigue: "@vuelta", ...r, rango: { de, n: i + 1 } };
  });
  return armar(src);
}

/** Una escena que sigue a un rango (o una mañana siguiente): vuelve sola a la noche. */
export function aparte(src: Record<string, Omit<EscenaSrc, "sigue"> & { sigue?: string }>): Record<string, Escena> {
  const out: Record<string, EscenaSrc> = {};
  for (const [id, e] of Object.entries(src)) out[id] = { sigue: "@vuelta", ...e };
  return armar(out);
}

/** Un romance está vivo si se eligió en el rango 8 y no se cortó después. */
export const enPareja = (c: Confidente): Condicion => ({ todas: [{ marca: `amor:${c}` }, { no: `corte:${c}` }] });

export const idRango = (de: Confidente, n: number) => `${de}-r${n}`;
